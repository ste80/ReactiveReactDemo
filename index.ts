// Import stylesheets
import './style.css';

import React, { Component, Fragment } from 'react';
import { render } from 'react-dom';
import { componentFromStreamWithConfig } from 'recompose';
import { Observable, combineLatest, from, timer } from 'rxjs';
import { map, switchMap, tap, filter } from 'rxjs/operators';

const h = React.createElement;

const componentFromStream = componentFromStreamWithConfig({
  fromESObservable: from,
  toESObservable: stream => stream
});

// Constants for Cat Requests
const CATS_URL = "https://placekitten.com/g/{w}/{h}";
function mapCats(response): Observable<string> {
  return from(new Promise((resolve, reject) => {
      var blob = new Blob([response], {type: "image/png"});
      let reader = new FileReader();      
      reader.onload = (data: any) => {
        resolve(data.target.result);
      };
      reader.readAsDataURL(blob);
  }));
}


/**
 * This function will make an AJAX request to the given Url, map 
 */
function requestData(url: string, mapFunc: (any) => Observable<string>): Observable<string> {
  return from((async () => {
    // This is generating a random size for a placekitten image
    //   so that we get new cats each request.
    const w = Math.round(Math.random() * 400);
    const h = Math.round(Math.random() * 400);
    const targetUrl = url
      .replace('{w}', w.toString())
      .replace('{h}', h.toString());
    console.log(targetUrl)
    return await (await fetch(targetUrl)).arrayBuffer();
  })())
  .pipe(
    switchMap((data) => mapFunc(data)),
    tap((data) => console.log('Request result: ', data))
  );
}


/**
 * This function will begin our polling for the given state, and
 * on the provided interval (defaulting to 5 seconds)
 */
function startPolling(interval: number = 5000): Observable<string> {
  return timer(0, interval)
    .pipe( switchMap(_ => requestData(CATS_URL, mapCats)) );
}

/* App */
const App = componentFromStream(props$ => {
  return combineLatest(
    props$,
    startPolling(5000),
    startPolling(5000),
    startPolling(5000)
  ).pipe(
    map(([props, ...values]) => (
      h('div', {className:`container-fluid p-1`},
        h('div', {className:`card`},
          h('div', {className:`card-body`},
            h('h5', {className:`card-title`}, `Ractive programming demo`),
            values.map((val, valI) => (
              !!val && h('img', {
                key: valI,
                src: val,
                className:`img-fluid img-thumbnail`,
                style: { minHeight: '10em' }
              })
            ))
          ),
        )
      )
    ))
  );
});

render(h(App), document.getElementById('app'));