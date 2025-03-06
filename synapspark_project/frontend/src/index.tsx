import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import App from './App';
import Auth from './Auth';

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/" component={App} />
    </Switch>
  </Router>,
  document.getElementById('root')
);
