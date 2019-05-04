# gitweb.js

Support language detection and syntax highlighting in legacy versions of [gitweb(1)](https://git-scm.com/docs/gitweb).

## Table of Contents

- [Description](#description)
- [Languages](#languages)
- [File Type Associations](#file-type-associations)

## Description

Legacy versions of Gitweb lack support for language detection and syntax highlighting, an important feature
found in modern VCS repository web UIs. For many, upgrading major versions is risky, time consuming, and prone
to downtime.

gitweb.js is a microlibrary that provides customizable support for language detection and syntax highlighting by
using [highlight.js](https://highlightjs.org) and jQuery.

## Languages

By default, language support is provided for:

- C
- C++
- CSS
- HTML
- JavaScript
- Perl
- PHP
- Ruby

## File Type Associations

All languages have at least one file type that can be directly associated with
source files of the given language. Likewise, many languages have multiple file
types that should be recognized as the same language. An example would be in PHP,
where `.php`, `.php5`, and `.phtml` are all valid PHP file types.

gitweb.js provides support for detecting and highlighting file types associated
with a primary file type.
