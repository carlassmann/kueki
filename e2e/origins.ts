/** Locally the app and the Worker are two processes on two ports; deployed they are one origin.
    Specs that only need the app use `appOrigin`, specs that talk to the Worker use `workerOrigin`. */
const deployed = process.env.KUEKI_E2E_ORIGIN?.replace(/\/$/, '');

export const appOrigin = deployed || 'http://localhost:4313';
export const workerOrigin = deployed || 'http://localhost:4311';

/** Only these specs are origin-agnostic; the rest assert behaviour that exists only on this machine. */
export const DEPLOYMENT_SPECS = ['**/pwa.spec.ts', '**/security.spec.ts'];
export const testsADeployment = !!deployed;
