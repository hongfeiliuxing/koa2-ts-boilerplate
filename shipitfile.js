// the deploy config
module.exports = function config(shipit) {
  require('shipit-deploy')(shipit);
  require('shipit-shared-copy')(shipit);

  shipit.initConfig({
    default: {
      workspace: '/tmp/app-koa2tsboil',
      dirToCopy: '/tmp/app-koa2tsboil/dist',
      deployTo: '/dodata/repos/app-koa2tsboil',
      repositoryUrl: 'git@github.com:lanvige/koa2-ts-boilerplate.git',
      branch: 'master',
      ignores: ['.DS_Store', '.git', 'node_modules'],
      rsync: ['--del'],
      keepReleases: 2,
      shallowClone: false,
      shared: {
        overwrite: true,
        files: [
          'ormconfig.json',
        ],
      },
    },
    staging: {
      servers: 'ares@h.d2labs.cn',
    },
    prod: {
      servers: 'ares@ac20.d2labs.cn',
    },
  });

  shipit.task('pwd', () => shipit.remote('pwd'));

  // npm install & build
  shipit.blTask('yarn-install', () => {
    shipit.log('yarn install.');
    return shipit.local('yarn install', { cwd: '/tmp/app-koa2tsboil' });
  });

  shipit.blTask('yarn-build', () => {
    shipit.log('yarn build start.');
    shipit.local('mv ormconfig.example.json ormconfig.json', { cwd: '/tmp/app-koa2tsboil' });
    return shipit.local('yarn run build', { cwd: '/tmp/app-koa2tsboil' });
  });

  shipit.on('fetched', () => {
    shipit.log('run yarn build');
    shipit.start(['yarn-install', 'yarn-build']);
  });


  // Docker dislike soft link
  // So make a physical copy (deploy) instead of softlink (current)
  shipit.blTask('deploy-clean', () => {
    shipit.log(`cp -R ${shipit.releasePath} ${shipit.config.deployTo}/deploy`);
    return shipit.remote(`rm -rf ${shipit.config.deployTo}/deploy`);
  });

  shipit.blTask('deploy-duplicate', () => {
    shipit.log('====');
    return shipit.remote(`cp -R ${shipit.releasePath} ${shipit.config.deployTo}/deploy`);
  });

  shipit.on('published', () => {
    shipit.log('====');
    return shipit.start(['deploy-clean', 'deploy-duplicate']);
  });


  // Docker build & run on Remote
  shipit.blTask('docker-up', () => {
    shipit.log('docker-compose up with build...');
    return shipit.remote(`cd ${shipit.config.deployTo}/deploy; docker-compose up -d --build`);
  });
};
