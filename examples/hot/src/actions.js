export default {
  down: (state, value) => ({ count: state.count - value }),
  up: (state, value) => ({ count: state.count + value })
};
