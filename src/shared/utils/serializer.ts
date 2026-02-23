export const serializeBigInt = (obj: any): any => {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
};

export const toIso = (value: Date | string) => {
  if (!value) return "";
  return new Date(value).toISOString();
};