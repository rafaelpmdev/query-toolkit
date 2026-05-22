import { describe, expect, it } from 'vitest';
import { Mapper } from './mapper';
import { MapperBuilder } from './mapper-builder';

type Model = {
  modelProp1: number;
  modelProp2: string;
  modelProp3: string;
};

type Entity = {
  entityProp1: number;
  entityProp2: string;
  entityProp3: string;
};

const mapper: Mapper<Model, Entity> = {
  modelProp1: 'entityProp1',
  modelProp2: 'entityProp2',
  modelProp3: 'entityProp3',
};

describe('MapperBuilder Full Tests', () => {
  it('should map with custom transformation', () => {
    const m = { name: 'full_name' };
    const builder = new MapperBuilder(m);
    const entity = { full_name: 'John Doe' };
    const model = builder.entityToModel(entity);
    expect(model).toEqual({ name: 'John Doe' });
  });

  it('should handle model to entity mapping', () => {
    const m = { name: 'full_name' };
    const builder = new MapperBuilder(m);
    const model = { name: 'John Doe' };
    const entity = builder.modelToEntity(model);
    expect(entity).toEqual({ full_name: 'John Doe' });
  });

  it('should get raw column mappings', () => {
    const m = { name: 'full_name' };
    const builder = new MapperBuilder(m);
    expect(builder.getMappings()).toEqual(m);
  });

  it('should convert empty string to null/undefined', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertEmptyToNull('entityProp2');
    expect(builder.entityToModel({ entityProp2: '' }).modelProp2).toBeNull();

    builder.convertEmptyToUndefined('entityProp2');
    expect(builder.entityToModel({ entityProp2: '' }).modelProp2).toBeUndefined();
  });

  it('should convert zero to null/undefined', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertZeroToNull('entityProp1');
    expect(builder.entityToModel({ entityProp1: 0 }).modelProp1).toBeNull();

    builder.convertZeroToUndefined('entityProp1');
    expect(builder.entityToModel({ entityProp1: 0 }).modelProp1).toBeUndefined();
  });

  it('should convert only numbers', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertOnlyNumbers('entityProp2');
    expect(builder.entityToModel({ entityProp2: 'a1b2c3' }).modelProp2).toBe('123');
  });

  it('should convert upper/lower case', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertToUpper('entityProp2');
    expect(builder.entityToModel({ entityProp2: 'test' }).modelProp2).toBe('TEST');

    builder.convertToLower('entityProp2');
    expect(builder.entityToModel({ entityProp2: 'TEST' }).modelProp2).toBe('test');
  });

  it('should convert JSON string <-> object', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertJsonStringToObject('entityProp2');
    expect(builder.entityToModel({ entityProp2: '{"a":1}' }).modelProp2).toEqual({ a: 1 });

    builder.convertObjectToJsonString('entityProp2');
    expect(builder.entityToModel({ entityProp2: { a: 1 } as any }).modelProp2).toBe('{"a":1}');
  });

  it('should convert strings to number/float', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertStrToNumber('entityProp2');
    expect(builder.entityToModel({ entityProp2: '123,45' }).modelProp2).toBe(123.45);

    builder.convertStrToFloat('entityProp2');
    expect(builder.entityToModel({ entityProp2: '123.45' }).modelProp2).toBe(123.45);
  });

  it('should convert to boolean', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertStrToBoolean('entityProp2');
    expect(builder.entityToModel({ entityProp2: 'true' }).modelProp2).toBe(true);
    expect(builder.entityToModel({ entityProp2: 'false' }).modelProp2).toBe(false);
    expect(builder.entityToModel({ entityProp2: 1 } as any).modelProp2).toBe(true);
  });

  it('should convert to date and ISO', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertStrToDate('entityProp2');
    const date = new Date('2024-01-01');
    expect(builder.entityToModel({ entityProp2: '2024-01-01' }).modelProp2).toEqual(date);

    builder.convertDateToIso('entityProp2');
    expect(builder.entityToModel({ entityProp2: date as any }).modelProp2).toBe(date.toISOString());
  });

  it('should convert to time string', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertTime('entityProp2');
    const date = new Date('2024-01-01T12:34:56Z');
    expect(builder.entityToModel({ entityProp2: date as any }).modelProp2).toBe('12:34:56');
  });

  it('should use default value', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    builder.convertDefaultAs('entityProp2', 'fallback');
    expect(builder.entityToModel({ entityProp2: null as any }).modelProp2).toBe('fallback');
  });

  it('should provide column mapper', () => {
    const builder = new MapperBuilder<Model, Entity>(mapper);
    expect(builder.toColumnMapper()).toEqual({
      entityProp1: 'modelProp1',
      entityProp2: 'modelProp2',
      entityProp3: 'modelProp3',
    });
  });
});
