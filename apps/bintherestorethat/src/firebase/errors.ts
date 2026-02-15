export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    const { path, operation } = context;
    // Note: We don't include requestResourceData in the message to avoid leaking sensitive data in logs.
    // The context object still holds it for debugging purposes.
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
{
  "path": "${path}",
  "operation": "${operation}"
}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    // The 'digest' property is a Next.js convention to make errors stand out.
    (this as any).digest = `FIRESTORE_PERMISSION_ERROR: ${JSON.stringify({ path, operation })}`;
  }
}
