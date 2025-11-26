module.exports = {
  apps: [
    {
      name: 'scrumkit-frontend',
      script: 'bash',
      args: '-c "lsof -ti :7000 | xargs kill -9 2>/dev/null; exec bun run dev"',
      cwd: './packages/frontend',
      watch: false,
    },
    {
      name: 'scrumkit-backend',
      script: 'bash',
      args: '-c "lsof -ti :7001 | xargs kill -9 2>/dev/null; exec bun run dev"',
      cwd: './packages/backend',
      watch: false,
    }
  ]
}
