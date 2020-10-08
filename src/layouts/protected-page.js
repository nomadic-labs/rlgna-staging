import React from "react";
import { connect } from "react-redux";
import { navigate } from 'gatsby';
import { FirebaseAuth } from 'react-firebaseui';

import firebase from "../firebase/init";

import {
  userLoggedIn,
  userLoggedOut,
} from "../redux/actions";


const mapStateToProps = state => {
  const allowEditing = state.adminTools.user && state.adminTools.user.isEditor;

  return {
    isLoggedIn: state.adminTools.isLoggedIn,
    allowEditing: allowEditing,
    user: state.adminTools.user
  };
};

const mapDispatchToProps = dispatch => {
  return {
    userLoggedIn: user => {
      dispatch(userLoggedIn(user));
    },
    userLoggedOut: () => {
      dispatch(userLoggedOut());
    },
  };
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    textAlign: 'center',
    flexDirection: 'column'
  }
}

const uiConfig = {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  credentialHelper: 'NONE',
  callbacks: {
      signInSuccessWithAuthResult: () => navigate('/admin')
    }
};


class ProtectedPage extends React.Component {
  state = { firebaseAuth: null }

  componentDidMount() {
    this.setState({ loading: true, firebaseAuth: firebase.auth() }, () => {
      this.state.firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          const ref = firebase
            .app()
            .database()
            .ref(`users/${user.uid}`);
          ref.once("value").then(snapshot => {
            const userData = snapshot.val();
            if (userData) {
              this.props.userLoggedIn(userData);
              this.setState({ loading: false })
            } else {
              const newUser = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
              };
              ref.set(newUser);
              this.props.userLoggedIn(newUser);
              this.setState({ loading: false })
            }
          });
        } else {
          this.props.userLoggedOut();
          this.setState({ loading: false })
        }
      });
    })
  }

  render () {
    if (this.state.loading) {
      return <div className="width-100 height-100 display-flex justify-center align-center"><div className="loader">loading...</div></div>
    }

    if (this.props.editor && this.props.allowEditing) {
      return <div>{this.props.children}</div>
    }

    if (!this.props.editor && this.props.isLoggedIn) {
      return <div>{this.props.children}</div>
    }

    return (
      <div style={styles.container}>
          <h1>Sign up / Sign in</h1>
          {this.state.firebaseAuth && <FirebaseAuth uiConfig={uiConfig} firebaseAuth={this.state.firebaseAuth} />}
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProtectedPage);
