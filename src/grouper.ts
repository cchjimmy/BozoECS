export class Grouper<K, V> {
  private _keyToGroups: Map<K, Set<V>> = new Map();
  private _valueToKey: Map<V, K> = new Map();
  private _unusedSets: Set<V>[] = [];

  addToGroup(value: V, key: K): void {
    this._getSet(key).add(value);
    this._valueToKey.set(value, key);
  }

  removeFromGroup(value: V, key: K): void {
    this._keyToGroups.get(key)?.delete(value);
    this._valueToKey.delete(value);
  }

  switchGroup(value: V, oldGroup: K, newGroup: K): void {
    this._keyToGroups.get(oldGroup)?.delete(value);
    this._getSet(newGroup).add(value);
    this._valueToKey.set(value, newGroup);
  }

  getGroup(value: V): K | undefined {
    return this._valueToKey.get(value);
  }

  setGroup(value: V, group: K): void {
    this._keyToGroups.get(this._valueToKey.get(value) as K)?.delete(value);
    this._getSet(group).add(value);
    this._valueToKey.set(value, group);
  }

  delete(value: V): void {
    this._keyToGroups.get(this._valueToKey.get(value) as K)?.delete(value);
    this._valueToKey.delete(value);
  }

  deleteGroup(group: K): void {
    const set = this._keyToGroups.get(group);
    if (set == undefined) return;
    set.clear();
    this._unusedSets.push(set);
    this._keyToGroups.delete(group);
  }

  [Symbol.iterator]() {
    return this._keyToGroups.entries();
  }

  cleanEmptyGroups(): void {
    for (const entry of this._keyToGroups) {
      if (entry[1].size != 0) continue;
      this._unusedSets.push(entry[1]);
      this._keyToGroups.delete(entry[0]);
    }
  }

  private _getSet(group: K): Set<V> {
    let set = this._keyToGroups.get(group);
    if (set == undefined) {
      set = this._unusedSets.pop() ?? new Set();
      this._keyToGroups.set(group, set);
    }
    return set;
  }
}
