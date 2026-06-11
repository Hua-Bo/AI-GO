import mapboxgl from 'mapbox-gl';

interface AddGrayLayerOptions {
    map: mapboxgl.Map;
    id: string;
    imageUrl: string;
    colorRamp: [number, string][]
    /**
     * 图像覆盖的地理边界，四个角的经纬度坐标，顺序为：
     * [
     *   [minLng, maxLat], // 左上 (西北角)
     *   [maxLng, maxLat], // 右上 (东北角)
     *   [maxLng, minLat], // 右下 (东南角)
     *   [minLng, minLat], // 左下 (西南角)
     * ]
     */
    bounds?: [[number, number], [number, number], [number, number], [number, number]];
    opacity?: number;
}

/**
 * 添加灰度图层到 Mapbox 地图，使用 WebGL 自定义渲染实现灰度图像颜色映射
 * @param options - 配置参数
 * @param options.map - Mapbox 地图实例
 * @param options.id - 图层 ID
 * @param options.imageUrl - 灰度图像 URL
 * @param options.colorRamp - 颜色渐变映射数组，包含比例和颜色
 * @param options.bounds - 图像覆盖的地理边界 [minLng, minLat, maxLng, maxLat]
 * @param options.opacity - 图层透明度，默认 1
 */
export function addGrayLayer(options: AddGrayLayerOptions) {
    const {map, id, imageUrl, colorRamp, bounds, opacity = 1} = options;

    // 移除已有同名图层和数据源，避免重复添加
    if (map.getLayer(id)) {
        map.removeLayer(id);
    }
    if (map.getSource(id)) {
        map.removeSource(id);
    }
    if (map.getLayer(id + '-custom')) {
        map.removeLayer(id + '-custom');
    }

    // WebGL 相关对象（用于自定义灰度图层渲染流程）
    let gl: WebGLRenderingContext; // WebGL 渲染上下文，用于执行所有图形绘制命令
    let program: WebGLProgram; // WebGL 着色器程序，包含顶点着色器和片段着色器，实现灰度图与颜色映射的渲染
    let positionBuffer: WebGLBuffer | null; // 存储顶点位置坐标的缓冲区（四角墨卡托坐标），用于定位图像在地图上的区域
    let texCoordBuffer: WebGLBuffer | null; // 存储纹理坐标的缓冲区，对应图像的纹理贴图坐标（0~1），用于将图像与顶点关联
    let texture: WebGLTexture | null; // 存储灰度图像数据的纹理对象，片段着色器采样灰度值
    let textureLoaded = false; // 标志纹理是否加载完成，用于控制首次渲染，避免纹理未就绪时渲染异常
    let colorRampTexture: WebGLTexture | null; // 存储颜色映射的纹理（颜色渐变条），用于将灰度值映射为对应颜色
    let uMatrix: WebGLUniformLocation | null; // uniform 变量：变换矩阵（地图坐标变换用），控制顶点位置到屏幕空间的变换
    let uTexture: WebGLUniformLocation | null; // uniform 变量：灰度图纹理采样器，传递到片元着色器用于采样灰度值
    let uColorRamp: WebGLUniformLocation | null; // uniform 变量：颜色渐变纹理采样器，传递到片元着色器用于查表映射颜色
    let uOpacity: WebGLUniformLocation | null; // uniform 变量：图层透明度，控制渲染图层整体的透明度
    let aPosition: number; // attribute 变量：顶点坐标位置，指示顶点缓冲区数据在着色器中的位置
    let aTexCoord: number; // attribute 变量：纹理坐标位置，指示纹理坐标缓冲区数据在着色器中的位置

    let customLayer: mapboxgl.CustomLayerInterface = {
        id,
        type: 'custom',
        renderingMode: '2d',

        /**
         * WebGL 初始化回调，创建着色器程序、缓冲区、纹理，并加载图像
         * @param map - Mapbox 地图实例
         * @param glContext - WebGL 渲染上下文
         */
        onAdd: function (map, glContext) {
            gl = glContext;
            // 手动保存 WebGL 上下文到 customLayer 实例上，便于后续访问
            (customLayer as any).gl = glContext;

            // 创建顶点着色器和片段着色器程序
            program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

            // 计算四个角的墨卡托坐标，用于顶点位置缓冲区
            const defaultBounds: [[number, number], [number, number], [number, number], [number, number]] = [
                [-180, 85],  // 左上
                [180, 85],   // 右上
                [180, -85],  // 右下
                [-180, -85], // 左下
            ];
            const [topLeft, topRight, bottomRight, bottomLeft] = bounds ?? defaultBounds;
            const mcTopLeft = mapboxgl.MercatorCoordinate.fromLngLat(topLeft);
            const mcTopRight = mapboxgl.MercatorCoordinate.fromLngLat(topRight);
            const mcBottomRight = mapboxgl.MercatorCoordinate.fromLngLat(bottomRight);
            const mcBottomLeft = mapboxgl.MercatorCoordinate.fromLngLat(bottomLeft);

            // 原始按四角墨卡托坐标定位图像，顶点缓冲区存储四个角的坐标
            // 注意 bounds 中的顺序为左上、右上、右下、左下：
            const vertices = new Float32Array([
                mcBottomLeft.x, mcBottomLeft.y,
                mcBottomRight.x, mcBottomRight.y,
                mcTopLeft.x, mcTopLeft.y,
                mcTopRight.x, mcTopRight.y
            ]);
            positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            // 创建纹理坐标缓冲区，对应顶点的纹理映射坐标，保持不变
            texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([
                    0, 0,
                    1, 0,
                    0, 1,
                    1, 1
                ]),
                gl.STATIC_DRAW
            );

            // 初始化灰度图像纹理，异步加载图像数据
            textureLoaded = false;
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => {
                texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                // 设置纹理参数，保证图像边缘不重复，缩放时最近点过滤，避免颜色混合线
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                // 将图像垂直翻转，匹配 WebGL 纹理坐标系
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                // 上传灰度图像数据到纹理，使用 LUMINANCE 格式表示灰度
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, image);
                // 使用 requestAnimationFrame 包裹，确保首次渲染时纹理完全就绪，避免渲染异常
                requestAnimationFrame(() => {
                    textureLoaded = true;
                    // 通知地图重新绘制，触发 render 调用
                    map.triggerRepaint();
                });
            };
            image.src = imageUrl;

            // 创建颜色渐变纹理，用于将灰度值映射为颜色
            const rampCanvas = document.createElement('canvas');
            rampCanvas.width = 256;
            rampCanvas.height = 1;
            // 获取 2D 绘图上下文，用于绘制颜色渐变条纹理
            const rampCtx = rampCanvas.getContext('2d')!;
            // 创建线性渐变对象，沿水平方向从左到右
            const gradient = rampCtx.createLinearGradient(0, 0, rampCanvas.width, 0);
            // 遍历颜色映射数组，添加渐变色点，比例范围为 0~1
            for (const entry of colorRamp) {
                gradient.addColorStop(entry[0], entry[1]);
            }
            // 设置填充样式为创建的线性渐变
            rampCtx.fillStyle = gradient;
            // 绘制填充矩形，覆盖整个画布，生成渐变颜色条
            rampCtx.fillRect(0, 0, rampCanvas.width, 1);

            colorRampTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, colorRampTexture);
            // 设置纹理参数，避免边缘重复，使用最近点过滤，避免颜色混合线
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            // 颜色渐变纹理不翻转，保持正常方向
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            // 从画布中获取像素数据，用于上传到 WebGL 纹理
            const rampImageData = rampCtx.getImageData(0, 0, rampCanvas.width, 1);
            // 上传颜色渐变数据到纹理，格式为 RGBA
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rampCanvas.width, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, rampImageData.data);

            // 获取着色器中 uniform 和 attribute 位置，后续绘制时使用
            uMatrix = gl.getUniformLocation(program, 'u_matrix');
            uTexture = gl.getUniformLocation(program, 'u_texture');
            uColorRamp = gl.getUniformLocation(program, 'u_colorRamp');
            uOpacity = gl.getUniformLocation(program, 'u_opacity');

            aPosition = gl.getAttribLocation(program, 'a_position');
            aTexCoord = gl.getAttribLocation(program, 'a_texCoord');

            // 启用透明混合，允许图层透明区域显示底图
            // 该设置让片段着色器输出的 alpha 通道生效，实现图层半透明或透明区域能看到下方底图
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        },

        /**
         * 渲染回调，绘制灰度图像并根据颜色渐变纹理映射颜色，实现灰度图颜色渲染
         * @param glContext - WebGL 渲染上下文
         * @param matrixParam - 地图变换矩阵，传入的地图矩阵
         */
        render: function (glContext, matrixParam) {
            // 使用 customLayer 上的 colorRampTexture，保证 render 时总是使用最新的颜色渐变纹理
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rampTex = (customLayer as any).colorRampTexture || colorRampTexture;

            // 增加渲染前状态检查，确保纹理和资源均已准备好，避免渲染异常
            if (!texture || !textureLoaded || !rampTex) return;

            // 设置视口，保证渲染区域覆盖整个绘制缓冲区，避免渲染区域不完整
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            // 使用创建的着色器程序
            gl.useProgram(program);

            // 启用顶点属性 a_position，绑定顶点缓冲区，设置数据格式
            gl.enableVertexAttribArray(aPosition);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

            // 启用顶点属性 a_texCoord，绑定纹理坐标缓冲区，设置数据格式
            gl.enableVertexAttribArray(aTexCoord);
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

            gl.uniformMatrix4fv(uMatrix, false, matrixParam);

            // 绑定灰度图像纹理到纹理单元 0，并传递给着色器
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(uTexture, 0);

            // 绑定颜色渐变纹理到纹理单元 1，并传递给着色器
            gl.activeTexture(gl.TEXTURE1);
            if (rampTex) {
                gl.bindTexture(gl.TEXTURE_2D, rampTex);
            }
            gl.uniform1i(uColorRamp, 1);

            // 设置图层透明度 uniform
            gl.uniform1f(uOpacity, opacity);

            // 绘制四个顶点组成的矩形，使用 TRIANGLE_STRIP 方式绘制
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // 告诉 Mapbox 持续重绘，保证动画或交互时图层更新
            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);

    // 假设你在 initMap 后调用了 addGrayLayer，并且传入的 id 为 'imageUrl'
    const layerId = 'imageUrl';

    // 监听点击
    map!.on('click', (e) => {
        // 取到底层 canvas 和 custom layer 的 gl 上下文
        const canvas = map!.getCanvas();
        const rawLayer = map!.getLayer(layerId) as any;
        const customImpl = rawLayer.implementation as any;
        const gl: WebGLRenderingContext = customImpl.gl;

        // 点击事件的像素坐标
        const x = Math.floor(e.point.x);
        const y = Math.floor(canvas.height - e.point.y);

        // 读出 RGBA
        const pixel = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

        console.log( pixel[0]);

        // 只用 R 通道（灰度）
        const normalized = pixel[0] / 255;

        // 找到最接近的 ramp 停靠点
        const nearest = options.colorRamp.reduce((prev, curr) => {
            return Math.abs(curr[0] - normalized) < Math.abs(prev[0] - normalized) ? curr : prev;
        });

        // 反算成原始灰度值（0–255）
        const grayValue = nearest[0] * 255;
        console.log('点击位置灰度值 (0–255):', grayValue);
    });
}


/**
 * 顶点着色器源码
 * 作用：将顶点坐标通过变换矩阵转换到裁剪空间，同时传递纹理坐标到片元着色器
 */
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  uniform mat4 u_matrix;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = u_matrix * vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

/**
 * 片段着色器源码
 * 作用：根据灰度图纹理采样灰度值，利用颜色渐变纹理将灰度映射为颜色，应用透明度
 */
const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_texture; // 灰度图纹理
  uniform sampler2D u_colorRamp; // 颜色渐变纹理
  uniform float u_opacity; // 图层透明度
  varying vec2 v_texCoord; // 纹理坐标
  void main() {
    // 采样灰度图，取红色通道作为灰度值
    float gray = texture2D(u_texture, v_texCoord).r;
    // 根据灰度值在颜色渐变纹理中采样对应颜色
    vec4 color = texture2D(u_colorRamp, vec2(gray, 0.0));
    // 使用 discard 指令彻底丢弃灰度值接近 0 的像素，防止色带边缘污染
    if (gray < 0.01) {
      discard;
    } else {
      gl_FragColor = vec4(color.rgb, color.a * u_opacity);
    }
  }
`;

/**
 * 创建并编译 WebGL 着色器
 * @param gl - WebGL 渲染上下文
 * @param type - 着色器类型（顶点或片段）
 * @param source - 着色器源码
 * @returns 编译好的着色器对象
 * @throws 编译失败时抛出错误
 */
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Could not compile shader:\n' + info);
    }
    return shader;
}

/**
 * 创建 WebGL 程序，链接顶点和片段着色器
 * @param gl - WebGL 渲染上下文
 * @param vertexSource - 顶点着色器源码
 * @param fragmentSource - 片段着色器源码
 * @returns 链接好的程序对象
 * @throws 链接失败时抛出错误
 */
function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error('Could not link program:\n' + info);
    }
    return program;
}

/**
 * 更新已有灰度图图层的颜色渐变映射
 * @param map - Mapbox 地图实例
 * @param id - 图层 ID
 * @param newColorRamp - 新的颜色渐变映射数组
 */
export function updateGrayLayerColorRamp(map: mapboxgl.Map, id: string, newColorRamp: [number, string][]) {
    const rawLayer = map.getLayer(id) as any;
    const layer = rawLayer?.implementation as any; // 这里才是你真正定义的 customLayer
    const gl = layer?.gl as WebGLRenderingContext;
    if (!layer || !gl) {
        console.warn(`图层 ${id} 不存在或未缓存 WebGL 上下文`);
        return;
    }

    // 创建渐变纹理图像

    // 创建一个画布元素，用于绘制颜色渐变条纹理
    const rampCanvas = document.createElement('canvas');
    rampCanvas.width = 256;
    rampCanvas.height = 1;

    // 获取 2D 绘图上下文，用于在画布上绘制颜色渐变
    const rampCtx = rampCanvas.getContext('2d')!; // getContext('2d')：获取画布的二维绘图上下文，提供绘制图形和颜色的能力

    // 创建一个线性渐变对象，从左(0)到右(画布宽度)，用于定义颜色过渡
    const gradient = rampCtx.createLinearGradient(0, 0, rampCanvas.width, 0); // createLinearGradient(...)：创建线性渐变对象，用于定义渐变颜色的起点和终点

    // 遍历新的颜色映射数组，向渐变对象中添加颜色停靠点
    for (const entry of newColorRamp) {
        gradient.addColorStop(entry[0], entry[1]); // addColorStop(...)：向渐变中添加颜色停靠点，指定位置和颜色，实现颜色平滑过渡
    }

    // 设置绘图上下文的填充样式为定义好的线性渐变
    rampCtx.fillStyle = gradient; // fillStyle：设置当前绘图的填充样式，这里设为渐变颜色

    // 绘制一个矩形，填充整个画布区域，生成完整的颜色渐变条纹理
    rampCtx.fillRect(0, 0, rampCanvas.width, 1); // fillRect(...)：绘制填充矩形，覆盖画布，生成渐变颜色条

    // 从画布中获取像素数据，包含颜色信息，用于上传到 WebGL 纹理
    const rampImageData = rampCtx.getImageData(0, 0, rampCanvas.width, 1); // getImageData(...)：获取画布指定区域的像素数据，包含RGBA信息

    // 创建一个新的 WebGL 纹理对象，用于存储颜色渐变数据
    const newTexture = gl.createTexture(); // createTexture(...)：创建一个新的纹理对象

    // 绑定该纹理对象到当前纹理单元，准备上传数据和设置参数
    gl.bindTexture(gl.TEXTURE_2D, newTexture); // bindTexture(...)：将纹理对象绑定到指定目标，后续纹理操作都作用于该纹理

    // 设置纹理参数，定义纹理的行为和过滤方式
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // texParameteri(...)：设置纹理参数，这里设置S轴（横向）环绕方式为边缘延伸，避免重复
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // 设置T轴（纵向）环绕方式为边缘延伸，避免重复
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // 设置缩小过滤方式为最近点采样，防止颜色混合模糊
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // 设置放大过滤方式为最近点采样

    // 设置像素存储模式，禁止垂直翻转，保持颜色渐变方向正确
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // pixelStorei(...)：设置像素存储参数，这里禁止纹理数据垂直翻转

    // 上传颜色渐变像素数据到纹理，指定格式为 RGBA，宽度为画布宽度，高度为1
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rampCanvas.width, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, rampImageData.data); // texImage2D(...)：上传像素数据到当前绑定的纹理，完成纹理初始化

    // 将新创建的颜色渐变纹理赋值给图层，后续渲染时使用
    layer.colorRampTexture = newTexture;

    // 替换纹理后尝试立即渲染一次以提高视觉响应速度
    const matrix = (map as any).transform?.glCoordMatrix;
    if (matrix && typeof layer.render === 'function') {
        layer.render(gl, matrix);
    }
    map.triggerRepaint();
}