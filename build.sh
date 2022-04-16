#!/bin/sh
xpiname='tb-header-columns@peterfab.com.xpi'
rm -f "${xpiname}"
7z a -uq0 "${xpiname}" ./src/*
