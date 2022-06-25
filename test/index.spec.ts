describe('generating sdk', () => {
  it('should generate', () => {
    process.chdir('test/fixtures');
    require('../src/generate');
    return;
  });
});
