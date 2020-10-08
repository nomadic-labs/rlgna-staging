import React from 'react'
import { connect } from "react-redux";
import { filter, find } from 'lodash'
import Container from "@material-ui/core/Container"

import Layout from '../layouts/default';
import ProtectedPage from "../layouts/protected-page"

import { LANGUAGE_OPTIONS } from "../utils/constants"

import {
  fetchPages,
  updateFirebaseData,
  deploy,
} from "../redux/actions";


const mapDispatchToProps = dispatch => {
  return {
    updateFirebaseData: (data, callback) => {
      dispatch(updateFirebaseData(data, callback))
    },
    fetchPages: () => {
      dispatch(fetchPages())
    },
    deploy: () => {
      dispatch(deploy())
    },
  };
};

const mapStateToProps = state => {
  return {
    isEditingPage: state.adminTools.isEditingPage,
    pages: state.pages.pages,
  };
};

class AdminPage extends React.Component {
  state = { accessCode: ''}

  componentDidMount() {
    this.props.fetchPages()
  }

  filterPagesByLanguage = (pages, lang) => {
    return filter(pages, page => (page.category === "modules" && (page.lang === lang.value)));
  }

  nextPage = page => {
    return this.props.pages[page.next];
  }

  prevPage = page => {
    return find(this.props.pages, p => p.next === page.id)
  }

  orderedPages = (page, arr=[]) => {
    if (!page) {
      return arr
    }

    if (arr.includes(page)) {
      return arr
    }

    arr.push(page)

    const nextPage = this.nextPage(page)
    if (page === nextPage) {
      return arr
    }
    return this.orderedPages(this.nextPage(page), arr)
  }

  movePageForward = currentPage => () => {
    if (!currentPage.next) return false;

    const nextPage = this.nextPage(currentPage)
    const prevPage = this.prevPage(currentPage)

    let dataToUpdate = {
      [`pages/${currentPage.id}/next`]: nextPage.next || null,
      [`pages/${nextPage.id}/next`]: currentPage.id,
    }

    if (currentPage.head) {
      dataToUpdate[`pages/${nextPage.id}/head`] = true
      dataToUpdate[`pages/${currentPage.id}/head`] = null
    }

    if (prevPage) {
      dataToUpdate[`pages/${prevPage.id}/next`] = nextPage.id
    }

    this.props.updateFirebaseData(dataToUpdate, this.props.fetchPages)
  }

  movePageBack = currentPage => () => {
    const prevPage = this.prevPage(currentPage)
    if (!prevPage) return false

    const prevPrevPage = this.prevPage(prevPage)

    let dataToUpdate = {
      [`pages/${currentPage.id}/next`]: prevPage.id,
      [`pages/${prevPage.id}/next`]: currentPage.next || null,
    }

    if (prevPage.head) {
      dataToUpdate[`pages/${currentPage.id}/head`] = true
      dataToUpdate[`pages/${prevPage.id}/head`] = null
    }

    if (prevPrevPage) {
      dataToUpdate[`pages/${prevPrevPage.id}/next`] = currentPage.id
    }

    this.props.updateFirebaseData(dataToUpdate, this.props.fetchPages)
  }

  deletePage = page => () => {
    if (typeof window !== 'undefined')  {
      if (!window.confirm("Are you sure you want to delete this page?")) {
        return false
      }
    }

    const prevPage = this.prevPage(page)
    const nextPage = this.nextPage(page)

    let dataToUpdate = {
      [`pages/${page.id}`]: null,
    }

    if (prevPage) {
      dataToUpdate[`pages/${prevPage.id}/next`] = page.next || null
    }

    if (page.head && nextPage) {
      dataToUpdate[`pages/${nextPage.id}/head`] = true
    }

    if (page.translations) {
      Object.keys(page.translations).forEach(lang => {
        if (page.translations[lang]) {
          const translatedPageId = page.translations[lang].id
          dataToUpdate[`pages/${translatedPageId}/translations/${page.lang}`] = null
        }
      })
    }
    this.props.updateFirebaseData(dataToUpdate, this.props.fetchPages)
  }

  onSaveTranslationChanges = (translation, translationId, lang) => newContent => {
    const newTranslation = { ...translation, [lang]: newContent.text, id: translationId }
    this.props.updateTranslation(newTranslation)
  }

  updateAccessCode = (e) => {
    e.preventDefault()
    const { accessCode } = this.state;
    this.props.updateFirebaseData({ access_code: accessCode })
    this.setState({ accessCode: '' })
  }

  render() {
    const unorderedPages = filter(this.props.pages, page => !page.category || page.category === "uncategorized")
    const pagesByLanguage = [];

    LANGUAGE_OPTIONS.forEach(lang => {
      const langPages = this.filterPagesByLanguage(this.props.pages, lang)
      const pages = this.orderedPages(langPages.find(page => page.head))

      if (pages.length > 0) {
        pagesByLanguage.push({ ...lang, pages })
      }
    })

    return(
      <Layout theme="light" className="admin-page">
        <ProtectedPage>
          <Container>
            <h1 className="text-center">
              Website Configuration
            </h1>
          </Container>

          <Container>
            <h2>Access Code</h2>
            <div className="my-40">
              <form onSubmit={this.updateAccessCode} autoComplete="off" className="login-form mt-10 mb-6 display-flex">
                <input type="text" id="access-code" onChange={e => this.setState({ accessCode: e.currentTarget.value })} value={this.state.accessCode} />
                <input type="submit" value="Update access code" className="btn ml-2" />
              </form>
            </div>
          </Container>

          {/*<Container>
            <h2>Page Order</h2>
            <div className="my-40">
              {
                pagesByLanguage.map(lang => {
                  return(
                    <div key={lang.value}>
                      <h3 className="mt-3">{lang.label}</h3>
                      {
                        lang.pages.map(page => {
                          return(
                            <div className="ranked-item" key={page.id}>
                              <IconButton size="small" color="primary" onClick={this.movePageBack(page)} disabled={page.head}><ArrowUp /></IconButton>
                              <IconButton size="small" color="primary" onClick={this.movePageForward(page)} disabled={!page.next}><ArrowDown /></IconButton>
                              <IconButton size="small" color="primary" onClick={this.deletePage(page)} disabled={PERMANENT_PAGES.includes(page.id)}><DeleteForever /></IconButton>
                              <span className="ml-3"><Link to={page.slug}>{page.title}</Link></span>
                            </div>
                          )
                        })
                      }
                    </div>
                  )
                })
              }
            </div>
          </Container>
          */}

          {/*<Container>
              <h2>Uncategorized Pages</h2>
              <div className="my-40">
                {
                  unorderedPages.map(page => {
                    return(
                      <div className="ranked-item" key={page.id}>
                        <IconButton size="small" color="primary" onClick={this.deletePage(page)} disabled={PERMANENT_PAGES.includes(page.id)}><DeleteForever /></IconButton>
                        <span className="ml-3"><Link to={page.slug}>{page.title}</Link></span>
                      </div>
                    )
                  })
                }
              </div>
            </Container>*/}

          <Container>
            <div className="mt-10 mb-10">
              <button onClick={this.props.deploy} className="btn">Publish changes</button>
            </div>
          </Container>
        </ProtectedPage>
      </Layout>
    )
  }

}


export default connect(mapStateToProps, mapDispatchToProps)(AdminPage);
