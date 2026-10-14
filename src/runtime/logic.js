// Base class for the app's view-model. State updates are applied synchronously to
// `this.state` and then the host component re-renders (same contract as the prototype).
export class DCLogic {
  constructor(props) {
    this.props = props || {};
    this.state = {};
    this.__host = null;
  }
  setState(update, cb) {
    if (this.__host) this.__host.__setLogicState(update, cb);
    else this.state = { ...this.state, ...(typeof update === 'function' ? update(this.state) : update) };
  }
  forceUpdate() {
    if (this.__host) this.__host.forceUpdate();
  }
  componentDidMount() {}
  componentDidUpdate() {}
  componentWillUnmount() {}
  renderVals() {
    return {};
  }
}
