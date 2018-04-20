// NOTE Using Jest timers has no impact on the reported behavior.
// jest.useFakeTimers();

// Roughly approximate FB warning module
function warning(message) {
  const isMocked = !!(
    console.error.isSpy ||
    console.error.mock ||
    console.error.calls
  );

  if (isMocked) {
    console.error("Warning: " + message);
  } else {
    // NOTE Wrapping the thrown error (as shown below) fixes this repro.
    // But it is insufficient to fix the problem in more complex FB tests.
    // I'm not sure why this is yet.
    expect(() => {
      // throw new Error(message);
    }).not.toThrow();

    throw new Error(message);
  }
}

/**
 * The below test passes with a false positive:
 *
 *  ✓ reports an error thrown by an async function (3ms)
 *
 *  console.log index.test.js
 *    logging intentional warning
 *
 *  console.log index.test.js
 *    test done
 *
 *  Test Suites: 1 passed, 1 total
 *  Tests:       1 passed, 1 total
 */
test("reports an error thrown by an async function", async done => {
  // NOTE Explicitly telling Jest about failures "fixes" this broken test,
  // But relying on this opt-in behavior is fragile.
  // console.error = jest.fn(message => done.fail(message));

  async function test() {
    console.log("logging intentional warning");

    warning("intentional warning");
  }

  // NOTE Awaiting the test function would eliminate the false positive,
  // But we are trying to simulate an async function getting called indirectly,
  // (e.g. by a React component lifecycle)
  // In which case we would be unable to directly await it.
  test();

  // Make sure the warning above is logged (and the error thrown) before the test completes.
  // This sequencing is confirmed by the console.log() statements.
  await Promise.resolve(r => setTimeout(r, 200));

  // NOTE Using Jest timers has no impact on the reported behavior.
  // jest.runAllTimers();

  console.log("test done");

  // NOTE Explicitly calling done() has no impact on the reported behavior.
  done();
});
