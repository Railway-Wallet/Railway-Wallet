declare type Optional<T> = T | undefined;
declare type MapType<T> = Partial<Record<string, T>>;

declare var preventSecurityScreen: boolean;

// Add these declarations
declare module "@assets/animations/*.gif" {
  const content: any;
  export { content };
}

declare module "@assets/img/*.png" {
  const content: any;
  export { content };
}
