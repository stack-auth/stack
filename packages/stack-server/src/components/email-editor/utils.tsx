type NestedObject = { [key: string]: any };

export function objectStringMap<T extends NestedObject>(obj: T, func: (s: string) => string): T {
  function mapStrings(obj: NestedObject): NestedObject {
    const result: NestedObject = Array.isArray(obj) ? [] : {};
        
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
                
        if (typeof value === 'string') {
          result[key] = func(value);
        } else if (typeof value === 'object' && value !== null) {
          result[key] = mapStrings(value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  return mapStrings(obj) as T;
}