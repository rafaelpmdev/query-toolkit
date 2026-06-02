import { coalesce, isAssigned, isNullOrUndefined, JSONConverter } from '@raicampos/toolkit';
import { Mapper } from './mapper';

export type PropertyConverter<Table, Entity, K extends keyof Entity> = (
  value: unknown,
  property: keyof Table
) => Entity[K];

/**
 * A builder class for creating data mappers between entity and database model representations.
 * Useful for handling naming discrepancies and data transformations between application domain
 * and persistence layers.
 *
 * @typeParam Table - The interface/type representing the database table record.
 * @typeParam Entity - The interface/type representing the domain entity.
 */
export class MapperBuilder<Table extends object, Entity extends object> {
  private readonly convert: Map<keyof Entity, PropertyConverter<Table, Entity, keyof Entity>> =
    new Map();
  private readonly cachedMapperEntries: [keyof Table, keyof Entity][];

  constructor(private readonly mapper: Mapper<Table, Entity>) {
    this.cachedMapperEntries = Object.entries(mapper) as [keyof Table, keyof Entity][];
  }

  /**
   * Adds a custom property converter for a specific entity property.
   *
   * @param entityProperty - The key of the entity property.
   * @param convert - The conversion function that transforms the value.
   * @returns The MapperBuilder instance for chaining.
   */
  public addConverter<K extends keyof Entity>(
    entityProperty: K,
    convert: (value: unknown, property: keyof Table) => Entity[K]
  ) {
    this.convert.set(entityProperty, convert);
    return this;
  }

  /**
   * Converts empty strings to null.
   */
  public convertEmptyToNull<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === '' ? null : value) as Entity[K]
    );
  }

  /**
   * Converts empty strings to undefined.
   */
  public convertEmptyToUndefined<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === '' ? undefined : value) as Entity[K]
    );
  }

  /**
   * Converts a value of exactly `0` to null.
   */
  public convertZeroToNull<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === 0 ? null : value) as Entity[K]
    );
  }

  /**
   * Removes all non-numeric characters from a string or number value.
   */
  public convertOnlyNumbers<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) =>
        (isAssigned(value) ? value.toString().replace(/[^0-9]/gi, '') : value) as Entity[K]
    );
  }

  /**
   * Parses a value into a Date and outputs an ISO string.
   */
  public convertDateToIso<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (isNullOrUndefined(value)) {
        return value as Entity[K];
      }

      return new Date(value as string | number).toISOString() as Entity[K];
    });
  }

  /**
   * Converts a date string or timestamp into a HH:mm:ss time string.
   */
  public convertTime<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (value === null || value === undefined) {
        return value as Entity[K];
      }
      const date = new Date(value as string | number);
      return [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .map((item: number) => item.toString().padStart(2, '0'))
        .join(':') as Entity[K];
    });
  }

  /**
   * Converts a string value to uppercase.
   */
  public convertToUpper<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => value?.toString().toUpperCase() as Entity[K]
    );
  }

  /**
   * Converts a string value to lowercase.
   */
  public convertToLower<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => value?.toString().toLowerCase() as Entity[K]
    );
  }

  /**
   * Converts a value of exactly `0` to undefined.
   */
  public convertZeroToUndefined<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === 0 ? undefined : value) as Entity[K]
    );
  }

  /**
   * Parses a JSON string representation into an object.
   */
  public convertJsonStringToObject<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => JSONConverter.parse(value as string) as Entity[K]
    );
  }

  /**
   * Stringifies an object or array into a JSON string representation.
   */
  public convertObjectToJsonString<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => JSONConverter.stringify(value) as Entity[K]
    );
  }

  /**
   * Converts a string containing numbers into a float, replacing commas with periods if present.
   */
  public convertStrToNumber<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => Number(value?.toString().replace(',', '.')) as Entity[K]
    );
  }

  /**
   * Parses a string containing floating point numbers, replacing commas with periods.
   */
  public convertStrToFloat<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => parseFloat(value?.toString()?.replace(',', '.') ?? '') as Entity[K]
    );
  }

  /**
   * Evaluates strings like "true" or "1" into a boolean true value, and other values to false.
   */
  public convertStrToBoolean<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (isNullOrUndefined(value)) {
        return value as Entity[K];
      }
      return (value === 'true' || value === true || value === '1' || value === 1) as Entity[K];
    });
  }

  /**
   * Parses a string representation into a Date object.
   */
  public convertStrToDate<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) =>
        (isNullOrUndefined(value) ? value : new Date(value as string | number)) as Entity[K]
    );
  }

  /**
   * Specifies a default fallback value when the field is empty, null or undefined.
   */
  public convertDefaultAs<K extends keyof Entity>(entityProperty: K, defaultValue: Entity[K]) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => coalesce(value, defaultValue) as Entity[K]
    );
  }

  /**
   * Applies the defined mappings and converters from a Domain Entity object to a Database Table object.
   * Properties with explicit converters defined are converted via those functions,
   * while properties directly mapped in the constructor's `Mapper` object are preserved directly.
   *
   * @param entity - The domain Entity object to convert.
   * @returns The corresponding Table interface/type object.
   */
  public entityToModel(entity: Partial<Entity>): Table {
    if (isNullOrUndefined(entity)) {
      return entity as unknown as Table;
    }

    const model = {} as Table;

    for (let i = 0; i < this.cachedMapperEntries.length; i++) {
      const [modelProp, entityProp] = this.cachedMapperEntries[i];
      const originalValue = entity[entityProp];
      const converter = this.convert.get(entityProp);

      if (!converter) {
        model[modelProp] = originalValue as Table[keyof Table];
        continue;
      }

      model[modelProp] = (
        Array.isArray(originalValue)
          ? originalValue.map((item: unknown) => converter(item, modelProp))
          : converter(originalValue, modelProp)
      ) as Table[keyof Table];
    }

    return model;
  }

  /**
   * Returns a reversed column mapping from Domain Entity keys to Database Table keys.
   */
  public toColumnMapper(): Record<keyof Entity, keyof Table> {
    const acc = {} as Record<keyof Entity, keyof Table>;

    for (let i = 0; i < this.cachedMapperEntries.length; i++) {
      const [modelProp, entityProp] = this.cachedMapperEntries[i];
      acc[entityProp] = modelProp;
    }

    return acc;
  }

  /**
   * Maps properties from a Database Table object directly back to a Domain Entity without invoking converters.
   * Converts keys based on the underlying mappings.
   *
   * @param model - The Database Table object representation.
   * @returns The corresponding domain Entity object.
   */
  public modelToEntity(model: Partial<Table>): Entity {
    if (isNullOrUndefined(model)) {
      return model as unknown as Entity;
    }

    const entity = {} as Entity;

    for (let i = 0; i < this.cachedMapperEntries.length; i++) {
      const [modelProp, entityProp] = this.cachedMapperEntries[i];
      entity[entityProp] = model[modelProp] as Entity[keyof Entity];
    }

    return entity;
  }

  /**
   * Gets the raw property mapping provided to the constructor.
   */
  public getMappings(): Mapper<Table, Entity> {
    return this.mapper;
  }
}
