#!/bin/sh
xpiname='original-to-column@peterfab.com.xpi'
rm -f "${xpiname}"
7z a -uq0 "${xpiname}" ./src/*
