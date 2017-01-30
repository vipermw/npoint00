import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './App';
import DocumentPage from './pages/DocumentPage';
import DocumentIndexPage from './pages/DocumentIndexPage';
import IndexPage from './pages/IndexPage';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={IndexPage} />
    <Route path="/docs" component={DocumentIndexPage} />
    <Route path="/docs/:documentId" component={DocumentPage} />
  </Route>
);
