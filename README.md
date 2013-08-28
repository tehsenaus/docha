docha
=====

Generate documentation from your Mocha BDD tests

Install: ```npm install --save-dev docha```

## Usage

In your project directory, run:

```
docha
```

**Note:** This will overwrite any ```README.md``` file that was already there!

It assumes your Mocha tests are under ```test/```.

## Example

If we have the following in ```test/test.js```:

```
describe('Something', function () {
	describe('some function', function () {
		it('does some work', function () {
			fn('data').should.equal('result')
		})
	})
})

```

The output ```README.md``` will be:

    # Something
    ## some function
     some function does some work
    
    ```
    fn('data').should.equal('result')
    ```

For a more fully-fledged example, see: https://github.com/tehsenaus/node-mkenv
