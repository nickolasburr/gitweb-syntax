/**
*
* Microlibrary for syntax highlighting Gitweb blobs
* @author Nickolas Burr <nickolasburr@gmail.com>
*
*/
(function ($) {
	// add _DOMContentLoaded_ event listener
	$(document).ready(onReady);
	// valid file types
	var VALID_FILE_TYPES = [
		'c', 'css', 'js',
		'htaccess', 'html',
		'json', 'md', 'php',
		'pl', 'py', 'rb',
		'sh', 'xml', 'xslt'
	],
	// valid file type synonyms
	VALID_FILE_TYPE_SYNONYMS = {
		c: ['cpp', 'h'],
		html: ['htm', 'dhtml', 'xhtml'],
		js: ['jse', 'json'],
		pl: ['cgi', 'perl'],
		php: ['php5', 'phtml'],
		rb: ['erb']
	},
	// valid file type associations
	VALID_FILE_TYPE_ASSOCS = {
		html: ['css', 'js', 'php'],
		json: ['js'],
		php: ['css', 'html', 'js']
	};
	// _DOMContentLoaded_ event handler
	function onReady () {
		// query string Gitweb uses for processing
		var queryString = document.location.search;
		// if there isn't a query string (i.e. home page), simply return
		if (!queryString) {
			return;
		}
		// check for file blob
		var isBlob = isFileBlob(queryString);
		// if the current page isn't a file blob, simply return
		if (!isBlob) {
			return;
		}
		// otherwise, highlight the file syntax
		return highlightSyntax(queryString);
	}
	// determine if the current page is a file blob
	function isFileBlob (queryString) {
		// split into array of strings
		var splitQueryString = queryString.split(';a=blob');
		// if `;a=blob` exists within the query string,
		// the length will be > 1 and, therefore, coerced to truthy value
		var isBlob = splitQueryString.length - 1;
		if (!isBlob) {
			return false;
		}
		return true;
	}
	// get file type associations
	function getFileTypeAssocs (fileType) {
		// will hold an array of strings representing file types
		var fileTypes = [];
		// object keys from `VALID_FILE_TYPE_ASSOCS`
		var keys = Object.keys(VALID_FILE_TYPE_ASSOCS);
		// push `fileType` onto `fileTypes` array
		fileTypes.push(fileType);
		// if `fileType` isn't a key found in `VALID_FILE_TYPE_ASSOCS`,
		// just return `fileTypes` array
		if (keys.indexOf(fileType) === -1) {
			return fileTypes;
		}
		// concat `fileTypes` with array of associated file types,
		fileTypes = fileTypes.concat(VALID_FILE_TYPE_ASSOCS[fileType]);
		// and return the corresponding array of associated file types
		return fileTypes;
	}
	// get the primary file type from a synonym
	function getPrimaryFileType (fileType) {
		// object keys from `VALID_FILE_TYPE_SYNONYMS`
		var keys = Object.keys(VALID_FILE_TYPE_SYNONYMS);
		var len = keys.length;
		// loop through `keys` array
		for (var i = 0; i < len; i += 1) {
			var thisKey = keys[i];
			var thisFileTypeSynonyms = VALID_FILE_TYPE_SYNONYMS[thisKey];
			// if `fileType` is found in synonyms array, return the key (primary file type)
			if (thisFileTypeSynonyms.indexOf(fileType) !== -1) {
				return thisKey;
			}
		}
		// otherwise, return null
		return null;
	}
	// determine if file type is synonym (or can be applied to) by another file type
	function isFileTypeSynonym (fileType) {
		// object keys from `VALID_FILE_TYPE_SYNONYMS`
		var keys = Object.keys(VALID_FILE_TYPE_SYNONYMS);
		var len = keys.length;
		// loop through `keys` array
		for (var i = 0; i < len; i += 1) {
			var thisKey = keys[i];
			var thisFileTypeSynonyms = VALID_FILE_TYPE_SYNONYMS[thisKey];
			// if `fileType` is a synonym, return true
			if (thisFileTypeSynonyms.indexOf(fileType) !== -1) {
				return true;
			}
		}
		// otherwise, return false
		return false;
	}
	// highlight file syntax
	function highlightSyntax (queryString) {
		// split into array of strings
		var splitQueryString = queryString.split(';f=');
		// if `;f=` exists with the query string,
		// the length will be > 0 and, therefore, coerced to truthy value
		// => this should always be true, but just for sanity sake, check it
		var isFile = splitQueryString.length - 1;
		if (!isFile) {
			return;
		}
		// full path name of the file
		var pathName = splitQueryString[1].split(';')[0];
		// split the path at directory separators
		var splitPathName = pathName.split('/');
		// file name of the blob
		var fileName = splitPathName[splitPathName.length - 1];
		// split the file name at the extension separator(s)
		var splitFileName = fileName.split('.');
		// get the file type
		var fileType = splitFileName[splitFileName.length - 1];
		// check the file type against valid file types and synonyms
		var isValidFileType = VALID_FILE_TYPES.indexOf(fileType) !== -1 || isFileTypeSynonym(fileType);
		// if `fileType` is not a valid file type (or synonym), simply return
		if (!isValidFileType) {
			return;
		}
		// if `fileType` turns out to be a synonym and not a primary file type,
		// get the primary file type instead; otherwise, make no change
		fileType = VALID_FILE_TYPES.indexOf(fileType) === -1 ? getPrimaryFileType(fileType) : fileType;
		// get array of associated file types (or primary file type placed in an array)
		var fileTypes = getFileTypeAssocs(fileType);
		// configure highlight settings to replace tabs (for improved viewing),
		// and restrict highlighting to the language(s) associated with `fileType`
		hljs.configure({
			tabReplace: ' ',
			languages: fileTypes
		});
		// highlight `<div class="pre">` blocks instead of default `<pre><code>` blocks
		$('div.pre').each(function (i, block) {
			// highlight the given block
			hljs.highlightBlock(block);
		});
		// reset the line numbers back to default color
		$('.linenr').each(function (i, element) {
			$(element).css('color', '#000');
			// including child nodes
			if ($(element).has('.hljs-number')) {
				$(element).find('.hljs-number').css('color', '#000');
			}
		});
	}
}).call(this, jQuery);
