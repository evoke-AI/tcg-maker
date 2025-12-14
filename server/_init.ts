import * as appInsights from 'applicationinsights';

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true);

  appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = "mplus-web";
  appInsights.start();

  // Set up global error handling
  process.on('unhandledRejection', (reason: unknown) => {
    appInsights.defaultClient.trackException({
      exception: reason instanceof Error ? reason : new Error(String(reason)),
      properties: { type: 'unhandledRejection' }
    });
  });

  process.on('uncaughtException', (error: Error) => {
    appInsights.defaultClient.trackException({
      exception: error,
      properties: { type: 'uncaughtException' }
    });
  });

  console.log('Application Insights initialized');
} 