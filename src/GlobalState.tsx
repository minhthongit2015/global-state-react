/* eslint-disable no-unused-vars */
import React, { Component, Dispatch, SetStateAction } from 'react';

class GlobalState {
  static GlobalStateKey = 'GlobalState';

  static state: { [stateName: string]: any } = {};

  static volatileStates: { [stateName: string]: any } = {};

  static listeners: { [stateName: string]: Set<any> } = {};

  static isInitialized = false;

  static storage = window.localStorage;

  static init() {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
    this.state = {};
    this.volatileStates = new Set();
    this.listeners = {};
    this.loadState();
  }

  static ensureInitialized() {
    this.init();
  }

  static useState = <S extends unknown>(
    name: string,
    initialState: S | (() => S), classComponent?: Component, useForceUpdate = false
  ) => {
    GlobalState.ensureInitialized();
    let newState: S;
    let newSetState: Dispatch<SetStateAction<S>>;

    if (classComponent) {
      newState = GlobalState.state[name]
        || (classComponent.state ? classComponent.state[name] : null)
        || initialState;
      newSetState = useForceUpdate
        ? () => classComponent.forceUpdate()
        : (value: any) => classComponent.setState({ [name]: value });
    } else {
      [newState, newSetState] = React.useState(
        GlobalState.state[name] !== undefined ? GlobalState.state[name] : initialState
      );
    }
    const isNewState = !(name in GlobalState);
    if (isNewState) {
      GlobalState.listeners[name] = new Set();
    }

    const privateComponentDidMount = Symbol('componentDidMount');
    const privateComponentWillUnmount = Symbol('componentWillUnmount');
    if (classComponent) {
      if (!classComponent[privateComponentDidMount]) {
        classComponent[privateComponentDidMount] = new Set();
        if (classComponent.componentDidMount) {
          classComponent[privateComponentDidMount].add(classComponent.componentDidMount);
        }
        classComponent.componentDidMount = (...args) => {
          classComponent[privateComponentDidMount].forEach(
            (callback: any) => callback.apply(classComponent, args)
          );
        };
        classComponent[privateComponentWillUnmount] = new Set();
        if (classComponent.componentWillUnmount) {
          classComponent[privateComponentWillUnmount].add(classComponent.componentWillUnmount);
        }
        classComponent.componentWillUnmount = (...args) => {
          classComponent[privateComponentWillUnmount].forEach(
            (callback: any) => callback.apply(classComponent, args)
          );
        };
      }
      
      classComponent[privateComponentDidMount].add(() => {
        GlobalState.listeners[name].add(newSetState);
      });
      classComponent[privateComponentWillUnmount].add(() => {
        GlobalState.listeners[name].delete(newSetState);
      });
    } else {
      React.useEffect(() => {
        GlobalState.listeners[name].add(newSetState);

        return () => {
          GlobalState.listeners[name].delete(newSetState);
        };
      }, [newSetState]);
    }

    const setter = (state: any) => GlobalState.setState(name, state);
    const getter = () => GlobalState.state[name];

    if (isNewState) {
      GlobalState.state[name] = newState;
      Object.defineProperty(GlobalState, name, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true
      });
    } else {
      newState = GlobalState.state[name];
    }

    return classComponent ? newState : [newState, setter];
  }

  static getState(name: string) {
    return this.state[name];
  }

  static setState<S>(name: string, state: SetStateAction<S>, callback?: () => void) {
    this.ensureInitialized();
    this.state[name] = state;
    if (this.listeners[name]) {
      this.listeners[name].forEach((setState) => setState(state, callback));
    }
    this.saveState();
  }

  static setVolativeState<S>(name: string, newState: SetStateAction<S>, callback?: () => void) {
    this.ensureInitialized();
    this.volatileStates.add(name);
    this.state[name] = newState;
    if (this.listeners[name]) {
      this.listeners[name].forEach((setState) => setState(newState, callback));
    }
  }

  static removeState(name: string) {
    this.setState(name, undefined);
    delete this.state[name];
    delete this.listeners[name];
  }

  static resetState<S>(name: string, initialState: S | (() => S)) {
    this.removeState(name);
    return this.useState(name, initialState);
  }

  static clearState() {
    this.init();
  }

  static saveState() {
    const clone = { ...this.state };
    this.volatileStates.forEach((volatileState: string) => delete clone[volatileState]);
    this.storage.setItem(this.GlobalStateKey, JSON.stringify(clone));
  }

  static loadState() {
    const savedStates = this.storage.getItem(this.GlobalStateKey);
    if (savedStates != null) {
      try {
        const parsedStates = JSON.parse(savedStates);
        if (typeof parsedStates === 'object') {
          Object.assign(this.state, parsedStates);
        }
      } catch (e) {
        //
      }
    }
  }

  // --- Some related utils

  static buildSavedState(object: any, states: string[] = []) {
    const savedState = {};
    if (!object || !states || !states.length) {
      return savedState;
    }
    states.forEach((stateName: string) => {
      savedState[stateName] = object[stateName];
    });
    return savedState;
  }

  static restoreFromSavedState(object: any, savedState: any, component: Component) {
    if (!object || !savedState || !Object.keys(savedState).length) {
      return object;
    }
    Object.assign(object, savedState);
    if (component) {
      return new Promise((resolve) => component.forceUpdate(() => resolve(object)));
    }
    return object;
  }
}

export default GlobalState;
