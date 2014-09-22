# Qubit Opentag JavaScript Library

## Welcome to the Qubit Opentag wiki!

## Simple package

* **Easy to use**: Qubit Opentag JavaScript library has been initially developed by [Qubit](http://www.qubitproducts.com) to help and simplify JavaScript serving for web sites. Especially with the ever growing number of online tools, today's developers and marketeers face a new challenge of managing and deploying various number of tags on their websites.
* **Optimum Design**: After using this technology successfully on many high traffic sites, [Qubit Team](http://www.qubitgroup.com) has decided to open up their Javascript and allow anyone to write their own container tag service.

## Made for sharing
At Qubit we believe that Tag Management should be accessible to all
businesses and website owners. With this in mind:

* Qubit has created together with the Enterprise version, two
free packages: (a) a hosted package which gives you up to a
million page views per 30 days for free; 
(b) a package that lets
you take the script and host it yourself.
* Qubit has opened up its code so that the community can use it
in their own websites as well as develop and evolve it.

## Contribute
* Founded by Xooglers, Qubit Group engineers use disruptive
technologies and approaches to help businesses understand
their data, and Qubit Opentag is the first in a series of
products.
* We are working full time, but in order to succeed we need
talented developers who can collaborate in their free time.
* Get involved in the creation of the first Tag Management
system available in open source, free hosted. We are always
open to new ideas!
* Gain experience working with some of the UK's most savvy
engineers and become recognized as contributing towards our
first product.

## Examples and Documentation


Opentag API follows well known OO JavaScript standards. To create a tag, an instance must be created with minimal configuration options. Although a minimal configuration is an empty object - it is recommended to name all tags:

```javascript
	var aTag = new qubit.opentag.BaseTag({"name": "My tag name"});
```

(to test this code open [blank Opentag API page](https://opentag2.qubitproducts.com/tagsdk/) and open console)

Once tag instance is created, it can be run:

```javascript
	aTag.run();
```

Empty tag, however, does not trigger anything. Let us have a tag that will load jQuery library and alerts jQuery presence:

```javascript
	var aTag = new qubit.opentag.BaseTag({
		"name": "My tag name",
		url: "http://code.jquery.com/jquery.js"
		});

	aTag.script = function() {
		alert("JQuery is present: " + !!jQuery);
	}

	aTag.run();
```

You will see alert saying "JQuery is present: true".

Example above could be run with shorter code:

```javascript
	new qubit.opentag.BaseTag({
		"name": "My tag name",
		url: "http://code.jquery.com/jquery.js",
		script : function() {
			alert("JQuery is present: " + !!jQuery);
		}
	}).run();
```

If you test this code in a browser, in console, there will be detailed logging information. To review the logs and display finest details, simply run:

```javascript
	aTag.log.rePrint(5);
```

Tag API collects execution information for better debugginh process.


For more details, guides and API documentation please refer to Qubit pages.

* [Guide Pages](https://opentag2.qubitproducts.com/tagsdk/docs)
* [API Documentation](https://opentag2.qubitproducts.com/tagsdk/docs/template.html#!/api/qubit.opentag.BaseTag)
* [Blank page to test API](https://opentag2.qubitproducts.com/tagsdk/) (open console and paste code)

## Licensing
Qubit Opentag is freely available to anyone under LGPL License.

If you make changes to it, we strongly encourage you to submit a pull request so everyone using Opentag can benefit from it.

If you find issues with it, please report them via the [Issues Tab](https://github.com/QubitProducts/Opentag/issues).

