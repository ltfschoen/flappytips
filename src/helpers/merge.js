function merge(...objects) {
  const merged = objects.reduce((a, obj) => {
    Object.entries(obj).forEach(([key, val]) => {
      a[key] = (a[key] || 0) + val;
    });
    return a;
  }, {});
  return Object.fromEntries(
    Object.entries(merged).sort(
      (a, b) => b[1] - a[1]
    )
  );
}

export default merge;
