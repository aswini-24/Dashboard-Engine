const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'crm-report-engine',
  filename: 'remoteEntry.js',
  exposes: {
    './crm-report-engine-main-module': './projects/crm-report-engine/src/app/modules/main/main.module.ts',
    './reportV2-module': './projects/crm-report-engine/src/app/modules/report/report.module.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

});
