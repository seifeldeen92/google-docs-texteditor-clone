import { FC } from "react";
import TextEditor from "./TextEditor/TextEditor";
import {
  BrowserRouter as Router,
  Switch,
  Redirect,
  Route,
} from "react-router-dom";
import Guid from "guid";

const App: FC = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Redirect to={`document/${Guid.create()}`} />
        </Route>
        <Route exact path="/document/:id" component={TextEditor} />
      </Switch>
    </Router>
  );
};

export default App;
