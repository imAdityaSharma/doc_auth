//Routes.js
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Home from "./components/Home";
import PageNotFound from "./components/PageNotFound";
import LoginForm from "./components/LoginForm";

const Router = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route exact component={PageNotFound} />
        <Route exact component={LoginForm} />
        <Route exact component={RegisterationForm} />
      </Switch>
    </BrowserRouter>
  );
};

export default Router;