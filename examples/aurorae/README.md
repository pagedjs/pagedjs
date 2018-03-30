# Aurorae

Test of different generating PDF tools using HTML and CSS.

* PDF reactor : [http://www.pdfreactor.com/](http://www.pdfreactor.com/)
* Prince XML : [https://www.princexml.com/](https://www.princexml.com/)

## Book

The book "Auroræ&nbsp;: their characters and spectra" by J. Rand Capron is used for comparaison.
The original (x)HTML file is part of the[Gutenberg project](http://www.gutenberg.org/), it has been transformed for the needs.

[I'm an inline-style link](http://www.gutenberg.org/ebooks/56159?msg=welcome_stranger)
Licence : Project Gutenberg License  
Title: Auroræ: Their Characters and Spectra  
Release Date: December 10, 2017 [EBook #56159]  
Language: English  
Character set encoding: UTF-8  

## Files

`index.html` : the Auroræ book
Before using, you must change the path of the CSS and javascript files according to the tool tested.

`book.css` : commun CSS for all tools (styling + footnotes + page breaks)  
`fonts` and `images` folders contain the resources used in all tools

Each tools have a specific file with :
* `layout-*.html` : CSS contain features for layout
* `script.html` : most tools accept javascript with proprietary access to layout information
* `aurorae-*.pdf` : the PDF generated

## TODO

* add other test-tools
  * Vivliostyle
  * Antennahouse

* add table comparaison



* add images, plates and figures + list of figures

* add index

* add cross references

* Styling tables
  * all table in chapters
  * add border-bottom when table is break
  * #table-appa-01 > 2 column

* add mathematical support + Styling

* balancing text in titles

* clean HTML
  * add span Greek
  * transform sidenotes into span

* remove all !important in CSS
