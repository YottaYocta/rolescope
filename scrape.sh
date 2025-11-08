#!/bin/bash
  
while read -r url; do node index.js "$url" >> tmp.jsonl; done < urls.txt