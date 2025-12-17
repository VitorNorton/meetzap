export const base44 = {
  auth: {
    me: () => Promise.resolve(null),
    signOut: () => Promise.resolve(),
  },
  entities: {},
  functions: { invoke: () => Promise.resolve({ data: {} }) },
  integrations: { Core: {} },
};
