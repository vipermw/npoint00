import React, { Component } from 'react'
import Document from '../models/Document'
import Schema from '../models/Schema'
import JsonEditor from '../components/JsonEditor'
import Header from '../components/Header'
import ReactModal from 'react-modal';
import { IFRAME_SRC_DOC, evalParseObject } from '../helpers/sandboxedEval'
import { MdDone, MdEdit, MdLock } from 'react-icons/lib/md'
import { CSSTransitionGroup } from 'react-transition-group'
import {} from './DocumentPage.css';
import _ from 'lodash';

export default class DocumentPage extends Component {
  state = {
    title: '',
    originalContents: '',
    originalSchema: '',
    contents: null,
    schema: null,
    editable: false,
    isLoading: true,
    isEditingTitle: false,
    savedOriginalContents: '',
    savedOriginalSchema: '',
    contentsErrorMessage: '',
    schemaErrorMessage: '',
    serverErrors: [],
    lockdownContentsModalVisible: false,
    lockdownSchemaModalVisible: false,
    shareModalVisible: false,
    contentsLockedDown: false,
    schemaLockedDown: false,
  }

  sandboxedIframe: null

  loadDocument(token) {
    this.setState({ isLoading: true })

    Document.get(token).then((response) => {
      this.setState({
        title: response.data.title,
        contents: response.data.contents,
        originalContents: response.data.original_contents,
        savedOriginalContents: response.data.original_contents,
        schema: response.data.schema,
        originalSchema: response.data.original_schema,
        savedOriginalSchema: response.data.original_schema,
        editable: response.data.editable,
        isLoading: false
      })
    })
  }

  componentDidMount() {
    this.loadDocument(this.props.params.documentToken)
  }

  componentWillReceiveProps(newProps) {
    if (newProps.params.documentToken !== this.props.params.documentToken) {
      this.loadDocument(newProps.params.documentToken)
    }
  }

  autoformatData = () => {
    this.setState({
      originalContents: JSON.stringify(this.state.contents, null, 2),
    })
  }

  autoformatSchema = () => {
    this.setState({
      originalSchema: JSON.stringify(this.state.schema, null, 2),
    })
  }

  async updateJson(newOriginalContents) {
    this.setState({ originalContents: newOriginalContents })

    let { json, errorMessage } =
      await evalParseObject(newOriginalContents, this.sandboxedIframe)

    this.setState({
      contents: json,
      contentsErrorMessage: errorMessage,
    });

    // TODO(azirbel): Probably relies on whether schema is valid too. Refactor out
    if (_.isEmpty(errorMessage)) {
      this.validateSchema(json, this.state.schema)
    }
  }

  async updateSchema(newOriginalSchema) {
    this.setState({ originalSchema: newOriginalSchema })

    let { json, errorMessage } =
      await evalParseObject(newOriginalSchema, this.sandboxedIframe)

    console.log('j', json, errorMessage)
    this.setState({
      schema: json,
      schemaErrorMessage: errorMessage,
    });

    // TODO(azirbel): Probably relies on whether contents is valid too. Refactor out
    if (_.isEmpty(errorMessage)) {
      this.validateSchema(this.state.contents, json)
    }
  }

  async validateSchema(json, schema) {
    Schema.validate({
      schema: JSON.stringify(schema),
      contents: JSON.stringify(json)
    }).then(({ data }) => {
      let { errors } = data;
      this.setState({ serverErrors: errors });
    });
  }

  generateSchema = async () => {
    Schema.generate({
      contents: JSON.stringify(this.state.contents)
    }).then(({ data }) => {
      this.setState({
        schema: data.schema,
        originalSchema: data.original_schema,
      });
      this.validateSchema(this.state.contents, data.schema);
    });
  }

  removeSchema = () => {
    this.setState({
      schema: null,
      originalSchema: '',
    });
  }

  saveNewTitle = () => {
    Document.update(this.props.params.documentToken, {
      title: this.state.title,
    }).then(() => {
      this.setState({ isEditingTitle: false });
    })
  }

  saveDocument = () => {
    let saveState = _.cloneDeep(this.state);

    Document.update(this.props.params.documentToken, {
      contents: saveState.contents ? JSON.stringify(saveState.contents) : null,
      original_contents: saveState.originalContents,
      schema: saveState.schema ? JSON.stringify(saveState.schema) : null,
      original_schema: saveState.originalSchema,
    }).then(() => {
      this.setState({
        savedOriginalContents: saveState.originalContents,
        savedOriginalSchema: saveState.originalSchema,
      });
    })
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.saveNewTitle()
    }
  }

  handleOpenLockdownContentsModal = () => {
    this.setState({ lockdownContentsModalVisible: true });
  }

  handleCloseLockdownContentsModal = () => {
    this.setState({ lockdownContentsModalVisible: false });
  }

  handleLockdownContents = () => {
    this.setState({
      lockdownContentsModalVisible: false,
      contentsLockedDown: true,
      editable: false,
    });

    console.log('do the lockdown!');
  }

  handleOpenLockdownSchemaModal = () => {
    this.setState({ lockdownSchemaModalVisible: true });
  }

  handleCloseLockdownSchemaModal = () => {
    this.setState({ lockdownSchemaModalVisible: false });
  }

  handleLockDownSchema = () => {
    this.setState({
      lockdownSchemaModalVisible: false,
      schemaLockedDown: true,
    });

    console.log('do the lockdown!');
  }

  render() {
    let liveUrl = `api.npoint.io/${this.props.params.documentToken}`;
    let hasSaved = (this.state.originalContents === this.state.savedOriginalContents)
      && (this.state.originalSchema === this.state.savedOriginalSchema);

    return (
      <div className='document-page'>
        <ReactModal
          isOpen={this.state.lockdownContentsModalVisible}
          onRequestClose={this.handleCloseLockdownContentsModal}
          contentLabel="Lockdown JSON document"
          className="modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-header">
            Lockdown JSON document
          </div>
          <div className="modal-body">
            <p>
              Once a document is locked, it cannot be deleted and none of its data
              (except the title) can be changed.
            </p>
            <p>
              You can always clone the document later to keep editing under a different ID.
            </p>
            <p>
              <strong>
                This action cannot be undone.
              </strong>
            </p>
            <div className='button-group'>
              <button className='button primary danger' onClick={this.handleLockdownContents}>
                Lockdown JSON data
              </button>
              <button className='button' onClick={this.handleCloseLockdownContentsModal}>
                Cancel
              </button>
            </div>
          </div>
        </ReactModal>
        <ReactModal
          isOpen={this.state.lockdownSchemaModalVisible}
          onRequestClose={this.handleCloseLockdownSchemaModal}
          contentLabel="Lock schema"
          className="modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-header">
            Lock schema
          </div>
          <div className="modal-body">
            <p>
              Once a schema is locked, it cannot be changed again. The JSON data can still
              be edited, but must always conform to the schema.
            </p>
            <p>
              You can always clone the document later to change the schema under a different ID.
            </p>
            <p>
              <strong>
                This action cannot be undone.
              </strong>
            </p>
            <div className='button-group'>
              <button className='button primary danger' onClick={this.handleLockDownSchema}>
                Lock schema
              </button>
              <button className='button' onClick={this.handleCloseLockdownSchemaModal}>
                Cancel
              </button>
            </div>
          </div>
        </ReactModal>
        <Header fullWidth={true}>
          {this.renderEditableTitle()}
          <div className='flex-spring'/>
          {this.state.editable && (
            hasSaved ? (
              <button disabled className="button primary disabled">Saved</button>
            ) : (
              <button className="button primary" onClick={this.saveDocument}>Save</button>
            )
          )}
          <button className="button link">Share</button>
        </Header>
        <iframe
          className='hidden-iframe'
          sandbox='allow-scripts'
          srcDoc={IFRAME_SRC_DOC}
          ref={(el) => this.sandboxedIframe = el}
          key={this.props.params.documentToken}
        >
        </iframe>
        <div className="main-container">
          {!this.state.isLoading && !this.state.editable && (
            <div className="banner dark-gray">
              <div className="container flex align-center justify-center">
                <MdLock className='locked-icon'/>
                {this.state.contentsLockedDown ? (
                  'This document is locked, but you can make a copy.'
                ) : (
                  'This document belongs to another user. Log in to make changes, or make a copy.'
                )}
              </div>
            </div>
          )}
          <div className="main">
            <div className="row">
              <div className="col-xs-12 col-sm-6">
                <h5 className='data-header'>JSON Data</h5>
                {this.state.editable && (
                  <div className='button-group animated-button-container'>
                    <button className='button small' onClick={this.autoformatData}>Autoformat</button>
                    <button className='button small' onClick={this.handleOpenLockdownContentsModal}>Lockdown...</button>
                  </div>
                )}
                <JsonEditor
                  value={this.state.originalContents}
                  onChange={_.debounce((newValue) => this.updateJson(newValue), 1000)}
                  readOnly={!this.state.editable}
                />
                <div className='text-right'>
                  {this.state.contentsErrorMessage}
                </div>
              </div>
              <div className="col-xs-12 col-sm-6">
                <h5 className='data-header'>Schema</h5>
                {!_.isEmpty(this.state.originalSchema) ? (
                  <div>
                    {this.state.editable && (
                      <div className='animated-button-container'>
                        <CSSTransitionGroup
                          transitionName="example"
                          transitionEnterTimeout={400}
                          transitionLeaveTimeout={300}
                        >
                          {this.state.schemaLockedDown ? (
                            <div key='a' className='badge full-width'>
                              <MdLock className='locked-icon'/>
                              Locked
                            </div>
                          ) : (
                            <div key='b' className='button-group'>
                              <button className='button small' onClick={this.autoformatSchema}>Autoformat</button>
                              <button className='button small' onClick={this.removeSchema}>Remove schema</button>
                              <button className='button small' onClick={this.handleOpenLockdownSchemaModal}>Lock schema...</button>
                            </div>
                          )}
                        </CSSTransitionGroup>
                      </div>
                    )}
                    <JsonEditor
                      value={this.state.originalSchema}
                      onChange={_.debounce((newValue) => this.updateSchema(newValue), 1000)}
                      readOnly={!this.state.editable || this.state.schemaLockedDown}
                    />
                    <div className='text-right'>
                      {this.state.schemaErrorMessage}
                      {this.state.serverErrors.map((se, idx) => (
                        <p key={idx}>{se}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='button-group animated-button-container'>
                    <button
                      className="button small"
                      onClick={this.generateSchema}
                    >
                      Generate schema
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='flex-spring'/>
          <div className="section dark-white">
            <p className='text-center'>
              This document is available at&nbsp;
              <a target='_blank'
                href={liveUrl}>
                {liveUrl}
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  renderEditableTitle() {
    return this.state.isEditingTitle ? (
      <div className='flex align-center'>
        <input
          className='edit-title-input page-title'
          value={this.state.title}
          onKeyPress={(e) => this.handleKeyPress(e)}
          onChange={(e) => this.setState({ title: e.target.value })}
        />
        <button
          className='button link square edit-title-button'
          onClick={this.saveNewTitle}
        >
          <MdDone/>
        </button>
      </div>
    ) : (
      <div className='flex align-center'>
        <h1 className='page-title'>{this.state.title}</h1>
        {(this.state.editable || this.state.contentsLockedDown) && (
          <button
            className='button link square edit-title-button'
            onClick={() => this.setState({ isEditingTitle: true })}
          >
            <MdEdit/>
          </button>
        )}
      </div>
    )
  }
}
