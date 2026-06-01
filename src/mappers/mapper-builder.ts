/* eslint-disable @typescript-eslint/no-explicit-any */
import { coalesce, isAssigned, isNullOrUndefined, JSONConverter } from '@raicampos/toolkit';
import { Mapper } from './mapper';

export type PropertyConverter<Table, Entity, K extends keyof Entity> = (
  value: unknown,
  property: keyof Table
) => Entity[K];

export class MapperBuilder<Table extends Record<string, any>, Entity extends Record<string, any>> {
  private readonly convert: Map<keyof Entity, PropertyConverter<Table, Entity, any>> = new Map();
  private readonly cachedMapperEntries: [keyof Table, keyof Entity][];

  constructor(private readonly mapper: Mapper<Table, Entity>) {
    this.cachedMapperEntries = Object.entries(mapper) as [keyof Table, keyof Entity][];
  }

  public addConverter<K extends keyof Entity>(
    entityProperty: K,
    convert: (value: unknown, property: keyof Table) => Entity[K]
  ) {
    this.convert.set(entityProperty, convert);
    return this;
  }

  public convertEmptyToNull<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === '' ? null : value) as Entity[K]
    );
  }

  public convertEmptyToUndefined<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === '' ? undefined : value) as Entity[K]
    );
  }

  public convertZeroToNull<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === 0 ? null : value) as Entity[K]
    );
  }

  public convertOnlyNumbers<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) =>
        (isAssigned(value) ? value.toString().replace(/[^0-9]/gi, '') : value) as Entity[K]
    );
  }

  public convertDateToIso<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (isNullOrUndefined(value)) {
        return value as Entity[K];
      }

      return new Date(value as any).toISOString() as Entity[K];
    });
  }

  public convertTime<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (value === null || value === undefined) {
        return value as Entity[K];
      }
      const date = new Date(value as any);
      return [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .map((item: number) => item.toString().padStart(2, '0'))
        .join(':') as Entity[K];
    });
  }

  public convertToUpper<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => value?.toString().toUpperCase() as Entity[K]
    );
  }

  public convertToLower<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => value?.toString().toLowerCase() as Entity[K]
    );
  }

  public convertZeroToUndefined<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (value === 0 ? undefined : value) as Entity[K]
    );
  }

  public convertJsonStringToObject<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => JSONConverter.parse(value as any) as Entity[K]
    );
  }

  public convertObjectToJsonString<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => JSONConverter.stringify(value) as Entity[K]
    );
  }

  public convertStrToNumber<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => Number(value?.toString().replace(',', '.')) as Entity[K]
    );
  }

  public convertStrToFloat<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => parseFloat(value?.toString()?.replace(',', '.') ?? '') as Entity[K]
    );
  }

  public convertStrToBoolean<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(entityProperty, (value: unknown) => {
      if (isNullOrUndefined(value)) {
        return value as Entity[K];
      }
      return (value === 'true' || value === true || value === '1' || value === 1) as Entity[K];
    });
  }

  public convertStrToDate<K extends keyof Entity>(entityProperty: K) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => (isNullOrUndefined(value) ? value : new Date(value as any)) as Entity[K]
    );
  }

  public convertDefaultAs<K extends keyof Entity>(entityProperty: K, defaultValue: Entity[K]) {
    return this.addConverter(
      entityProperty,
      (value: unknown) => coalesce(value, defaultValue) as Entity[K]
    );
  }

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

  public toColumnMapper(): Record<keyof Entity, keyof Table> {
    const acc = {} as Record<keyof Entity, keyof Table>;

    for (let i = 0; i < this.cachedMapperEntries.length; i++) {
      const [modelProp, entityProp] = this.cachedMapperEntries[i];
      acc[entityProp] = modelProp;
    }

    return acc;
  }

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

  public getMappings(): Mapper<Table, Entity> {
    return this.mapper;
  }
}
