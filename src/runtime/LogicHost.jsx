import React from 'react';

/**
 * Owns one view-model instance and re-renders its children with the values it produces.
 *   <LogicHost Logic={AppLogic} options={{ startStage: 6 }}>{(vm) => <CustomerApp vm={vm} />}</LogicHost>
 */
export class LogicHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = { v: 0 };
    this.logic = new props.Logic(props.options || {});
    this.logic.__host = this;
  }
  __setLogicState(update, cb) {
    const prev = this.logic.state;
    const patch = typeof update === 'function' ? update(prev) : update;
    this.logic.state = { ...prev, ...patch };
    if (this.props.onState) this.props.onState(patch, this.logic.state);
    this.setState((s) => ({ v: s.v + 1 }), cb);
  }
  /** Apply a change that came from another surface: update and re-render, but do not re-publish it. */
  applyRemote(patch) {
    this.logic.state = { ...this.logic.state, ...patch };
    this.setState((s) => ({ v: s.v + 1 }));
  }
  componentDidMount() {
    this.logic.componentDidMount();
    if (this.props.onReady) this.props.onReady(this);
  }
  componentDidUpdate(prev) {
    this.logic.props = this.props.options || {};
    this.logic.componentDidUpdate(prev.options);
  }
  componentWillUnmount() {
    this.logic.componentWillUnmount();
  }
  render() {
    const options = this.props.options || {};
    this.logic.props = options;
    const vm = { ...options, ...this.logic.renderVals() };
    return this.props.children(vm, this.logic);
  }
}
