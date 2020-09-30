import React from "react";
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';


const Footer = () => (
  <footer>
    <Container maxWidth="md">
      <Grid container justify="space-between">
        <Grid item>
          <p><a href="/">Privacy Policy</a></p>
        </Grid>
        <Grid item>
          <p>For further questions, please <a href="/">contact our team</a>.</p>
        </Grid>
      </Grid>
    </Container>
  </footer>
)

export default Footer;