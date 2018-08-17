export default updateApp => (fileName, updateAs) =>
  module.hot.accept(`./${fileName}`, () => {
    import(`./${fileName}?${Date.now()}`).then(imported => {
      updateApp({
        [updateAs]: imported.default
      });
    });
  });
