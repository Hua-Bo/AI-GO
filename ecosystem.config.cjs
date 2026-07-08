module.exports = {
  apps: [
    {
      name: 'travel-ai',
      script: 'npm',
      args: 'run server',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
