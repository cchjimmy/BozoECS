export class Grouper<K, V> {
  private _keyToGroups: Map<K, Set<V>> = new Map();
  private _valueToKey: Map<V, K> = new Map();

  addToGroup(value: V, key: K): void {
    this._keyToGroups.getOrInsert(key, new Set()).add(value);
    this._valueToKey.set(value, key);
  }

  removeFromGroup(value: V, key: K): void {
    this._keyToGroups.get(key)?.delete(value);
    this._valueToKey.delete(value);
  }

  switchGroup(value: V, oldGroup: K, newGroup: K): void {
    this._keyToGroups.get(oldGroup)?.delete(value);
    this._keyToGroups.getOrInsert(newGroup, new Set()).add(value);
    this._valueToKey.set(value, newGroup);
  }

  getGroup(value: V): K | undefined {
    return this._valueToKey.get(value);
  }

  setGroup(value: V, group: K): void {
    this._keyToGroups.get(this._valueToKey.get(value) as K)?.delete(value);
    this._keyToGroups.getOrInsert(group, new Set()).add(value);
    this._valueToKey.set(value, group);
  }

  delete(value: V): void {
    this._keyToGroups.get(this._valueToKey.get(value) as K)?.delete(value);
    this._valueToKey.delete(value);
  }

  deleteGroup(group: K): void {
    const set = this._keyToGroups.get(group);
    this._keyToGroups.delete(group);
    if (set == undefined) return;
    for (const value of set) {
      this._valueToKey.delete(value);
    }
  }

  [Symbol.iterator]() {
    return this._keyToGroups.entries();
  }
}
