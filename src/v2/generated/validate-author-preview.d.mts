export interface SchemaError { instancePath: string; message?: string }
declare const validate: { (data: unknown): boolean; errors?: SchemaError[] | null };
export default validate;
