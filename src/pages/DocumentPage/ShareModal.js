// @format

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactModal from 'react-modal'
import Button from '../../components/Button'

export default class ShareModal extends Component {
  static propTypes = {
    document: PropTypes.object.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  render() {
    return (
      <ReactModal
        isOpen={this.props.isOpen}
        onRequestClose={this.props.onClose}
        contentLabel="Share"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">Share</div>
        <div className="modal-body prose">
          <p className="medium">Access this document via the API at:</p>
          <p className="medium">
            <a target="_blank" href={this.props.document.apiUrl}>
              {this.props.document.apiUrl}
            </a>
          </p>
          <p className="medium">{this.renderPermissionsCopy()}</p>
          <div className="button-group">
            <Button className="primary" onClick={this.props.onClose}>
              Done
            </Button>
          </div>
        </div>
      </ReactModal>
    )
  }

  renderPermissionsCopy() {
    let { document } = this.props

    if (document.ownedByCurrentUser) {
      if (document.editable) {
        return `Anyone with the link is able to view this document. Only you
        can edit the title and data.`
      } else {
        return `Anyone with the link is able to view this document. You have
        locked it for editing, so it can't be deleted and the data can't be
        changed. Only you can edit the title.`
      }
    } else {
      if (document.editable) {
        if (document.contentsLocked) {
          return `This document is public, but the data is locked. Anyone with
          the link can edit the title.`
        } else {
          return `This document is public: anyone with the link can edit the title
          and data.`
        }
      } else {
        return `Anyone with the link is able to view this document. Only the
        user who owns this document is able to edit it.`
      }
    }
  }
}
