import { describe, it, expect } from 'vitest'
import { parseJsonArray, parseJson } from './parseJson'

describe('parseJsonArray', () => {
  it('parses a valid JSON array string', () => {
    expect(parseJsonArray('[1,2,3]')).toEqual([1, 2, 3])
  })
  it('returns fallback for invalid JSON', () => {
    expect(parseJsonArray('not-json')).toEqual([])
    expect(parseJsonArray('not-json', ['fb'])).toEqual(['fb'])
  })
  it('returns fallback when result is not an array', () => {
    expect(parseJsonArray('{"a":1}')).toEqual([])
  })
  it('passes through an existing array unchanged', () => {
    const arr = [1, 2]
    expect(parseJsonArray(arr)).toBe(arr)
  })
  it('returns fallback for null/empty string', () => {
    expect(parseJsonArray(null)).toEqual([])
    expect(parseJsonArray('')).toEqual([])
    expect(parseJsonArray(undefined)).toEqual([])
  })
})

describe('parseJson', () => {
  it('parses a JSON string', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 })
  })
  it('returns fallback for invalid JSON', () => {
    expect(parseJson('bad', 42)).toBe(42)
  })
  it('returns value unchanged if not a string', () => {
    expect(parseJson({ a: 1 })).toEqual({ a: 1 })
  })
  it('returns fallback for null/empty', () => {
    expect(parseJson(null, 'default')).toBe('default')
    expect(parseJson('', 'default')).toBe('default')
  })
})
