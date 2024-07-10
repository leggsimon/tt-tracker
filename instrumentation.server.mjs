import * as Sentry from '@sentry/remix';

Sentry.init({
	dsn: 'https://2f9db4fa6138e79069129593197d1452@o4507318189817856.ingest.us.sentry.io/4507318190276608',
	tracesSampleRate: 1,
	autoInstrumentRemix: true,
});
