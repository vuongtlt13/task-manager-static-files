$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
$.widget.bridge('uibutton', $.ui.button)

const BAD_PAYLOAD = 422;
const UNAUTHENTICATED = 401;
const FORBIDDEN = 403;

String.prototype.format = function () {
    let i = 0, args = arguments;
    return this.replace(/%s/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

const parseNumber = (data, c = 2, d = ".", t = ",") => {
    return parseInt(String(data).split(t).join(''));
};

const formatNumber = (data, c = 2, d = ".", t = ",") => {
    return (data).toFixed(c).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
};

const showNotificationFromResponse = (resp, time = 5000, successTitle = 'Thành công!', errorTitle = 'Thất bại!') => {
    if (resp.success) toastr.success(resp.message, successTitle, {timeOut: time})
    else toastr.error(resp.message, errorTitle, {timeOut: time});
};

const showNotificationFromError = (error, time = 5000, errorTitle = 'Có lỗi xảy ra!') => {
    let errorMessage = "";
    switch (error.status) {
        case BAD_PAYLOAD:
            errorMessage = error.message;
            errorTitle = 'Dữ liệu nhập vào không hợp lệ!';
            break;
        case FORBIDDEN:
            errorMessage = error.message;
            errorTitle = 'Không có quyền thực hiện!';
            break;
        default:
            let responseJson = error.responseJSON;
            errorMessage = (responseJson && responseJson.message) ? responseJson.message : error.responseText;
    }
    toastr.error(errorMessage, errorTitle, {timeOut: time});
    if (error.status === UNAUTHENTICATED) {
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
};

const defaultOnBeforeSend = () => {
    $('#loading-modal').show();
};

const defaultOnCompleted = () => {
    $('#loading-modal').hide();
};

const defaultOnSuccess = (resp, table = null, modal = null) => {
    showNotificationFromResponse(resp);
    if (table) table.ajax.reload();
    if (modal) modal.modal('hide');
};

const defaultOnError = (error) => {
    showNotificationFromError(error);
};

const defaultAjaxOptions = {
    type: 'get',
    onBeforeSend: defaultOnBeforeSend,
    onSuccess: defaultOnSuccess,
    onError: defaultOnError,
    onCompleted: defaultOnCompleted,
    table: null,
    data: {},
    modal: null,
    defaultValues: {}
};

const mergeAjaxOptions = (options, defaultAjaxOptions) => {
    return {
        ...defaultAjaxOptions,
        ...options
    }
};

const sendAjax = (url, data, type = 'get', options = null) => {
    const ajaxOptions = {
        ...defaultAjaxOptions,
    }
    if (options === null) options = ajaxOptions;
    else options = mergeAjaxOptions(options, ajaxOptions);

    $.ajax({
        url: url,
        type: type,
        data: data,
        beforeSend: options.onBeforeSend,
        success: function (resp) {
            options.onSuccess(resp, options.table, options.modal);
        },
        error: options.onError,
        complete: options.onCompleted
    });
};

const sendAjaxWithoutNotify = (url, data, type = 'get', options = null) => {
    const ajaxOptions = {
        ...defaultAjaxOptions,
        onSuccess: (resp, table, modal) => {
            console.log('ok');
        }
    }
    if (options === null) options = ajaxOptions;
    else options = mergeAjaxOptions(options, ajaxOptions);

    $.ajax({
        url: url,
        type: type,
        data: data,
        beforeSend: options.onBeforeSend,
        success: function (resp) {
            options.onSuccess(resp, options.table, options.modal);
        },
        error: options.onError,
        complete: options.onCompleted
    });
}

const sendFormAjax = (jQueryForm, options = null) => {
    const ajaxOptions = {
        ...defaultAjaxOptions,
        url: jQueryForm.attr('action'),
        type: jQueryForm.attr('method'),
    }
    if (options === null) options = ajaxOptions;
    else options = mergeAjaxOptions(options, ajaxOptions);

    jQueryForm.ajaxSubmit({
        url: options.url,
        type: options.type,
        dataType: 'json',
        beforeSubmit: function (arr, $form, opts) {
            _defaults = {...options.defaultValues};
            for (let value in arr) {
                let key = arr[0].name;
                delete _defaults[key];
            }

            for (let key in _defaults) {
                let value = _defaults[key];
                if (Array.isArray(value)) {
                    for (let i in value) {
                        arr.push({'name': key + "[]", 'value': value[i]})
                    }
                } else {
                    arr.push({'name': key, 'value': value})
                }
            }
        },
        beforeSend: options.onBeforeSend,
        data: options.data,
        success: function (resp) {
            options.onSuccess(resp, options.table, options.modal);
        },
        error: options.onError,
        complete: options.onCompleted
    });
};

const resetForm = (form) => {
    form.find('input').each(function (index, ele) {
        let jqueryObj = $(ele);
        let value = jqueryObj.data('defaultValue') !== null ? jqueryObj.data('defaultValue') : null;

        if ((!jqueryObj.hasClass('ignore-reset')) && (!jqueryObj.hasClass('no-reset')) && (jqueryObj.attr('type') !== 'checkbox')) jqueryObj.val(value);
    });

    form.find('textarea').each(function (index, ele) {
        let jqueryObj = $(ele);
        let value = jqueryObj.data('defaultValue') !== null ? jqueryObj.data('defaultValue') : null;

        if ((!jqueryObj.hasClass('ignore-reset')) && (!jqueryObj.hasClass('no-reset')) && (jqueryObj.attr('type') !== 'checkbox')) jqueryObj.val(value);
    });

    form.find('select').each(function (index, ele) {
        let jqueryObj = $(ele);
        let value = jqueryObj.data('defaultValue') !== null ? jqueryObj.data('defaultValue') : null;
        if ((!jqueryObj.hasClass('ignore-reset')) && (!jqueryObj.hasClass('no-reset'))) {
            jqueryObj.val(value);
            if (jqueryObj.hasClass('select2')) jqueryObj.trigger('change');
        }
        if (jqueryObj.hasClass('duallistbox')) jqueryObj.bootstrapDualListbox('refresh', true);
    });
};

const getValueByAttr = (data, attrs) => {
    let res = null;
    attrs.map((attr) => {
        if (res === null) res = data[attr];
        else {
            if (res !== undefined) res = res[attr];
        }
    });
    return res;
};

const htmlDecode = (input) => {
    let doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

const fillData = (form, data, htmlType, handler) => {
    form.find(htmlType).each(function (index, ele) {
        let jqueryObj = $(ele);
        if (jqueryObj[0].hasAttribute('data-column')) {
            let dataField = jqueryObj.attr('data-column');
            let attrs = dataField.split(".");
            let value = getValueByAttr(data, attrs);
            if (typeof value === 'string' || value instanceof String) {
                value = htmlDecode(value);
            }
            handler(jqueryObj, value);
        }
    });
};

const fillTextAreaFunc = (jqueryObj, value) => {
    if (jqueryObj.attr('data-role') === 'tagsinput') {
        jqueryObj.tagsinput('removeAll');
        jqueryObj.tagsinput('add', value);
    } else jqueryObj.val(value);
};

const fillInputFunc = (jqueryObj, value) => {
    if (jqueryObj.attr('data-role') === 'tagsinput') {
        jqueryObj.tagsinput('removeAll');
        jqueryObj.tagsinput('add', value);
    } else if (jqueryObj.attr('type') === 'checkbox') jqueryObj.prop('checked', value == 1 || value == true);
    else jqueryObj.val(value).trigger('change');
};

const fillSelectFunc = (jqueryObj, value) => {
    jqueryObj.val(value);
    if (jqueryObj.hasClass('select2')) jqueryObj.trigger('change');
    if (jqueryObj.hasClass('duallistbox')) jqueryObj.bootstrapDualListbox('refresh', true);
};

const fillEditForm = (data, form, key = "id") => {
    let templateAction = form.data('templateAction');
    form.attr('action', templateAction.format(data[key]));

    fillData(form, data, 'textarea', fillTextAreaFunc);
    fillData(form, data, 'input', fillInputFunc);
    fillData(form, data, 'select', fillSelectFunc);
};

const editRecord = (ele, editForm, key = "id") => {
    let table = $(ele).closest('table').DataTable();
    let row = $(ele).closest('tr');
    let data = table.row(row).data();
    fillEditForm(data, editForm, key);
    editForm.closest('div.modal').modal('show');
};

const confirmBox = async (options = {}) => {
    let finalOptions = {
        ...defaultConfirmOptions,
        ...options,
    }
    return await swal({
        title: finalOptions.mainText,
        text: finalOptions.detailText,
        icon: finalOptions.icon,
        buttons: [finalOptions.cancel, finalOptions.agree],
        dangerMode: true,
    });
};

const deleteRecord = async (ele, uri, isConfirm = true, options = {}) => {
    let defaultOptions = {
        key: 'id',
        additionalAttrs: {}
    }

    options = {
        ...defaultOptions,
        ...options
    }
    let isConfirmed = true;
    if (isConfirm) isConfirmed = await confirmBox(options);
    if (isConfirmed) {
        let table = $(ele).closest('table').DataTable();
        let row = $(ele).closest('tr');
        let dataRow = table.row(row).data();

        let key = options.key;
        delete options.key;
        let additionalAttrs = options.additionalAttrs;
        delete options.additionalAttrs;

        let data = {};
        for (let k in additionalAttrs) {
            data[k] = dataRow[additionalAttrs[k]];
        }
        let id = dataRow[key];

        sendAjax(
            uri.format(id),
            {
                '_method': 'DELETE',
                ...data
            },
            'post',
            {
                ...options,
                table: table,
            }
        )
    }
};

const fnRowCallBack = (ele, data, rowIndex, selectedRows) => {
    let row = $(ele);
    if ($.inArray(data.id, selectedRows) !== -1) {
        if (!row.hasClass('selected_row')) row.addClass('selected_row');
    } else {
        if (row.hasClass('selected_row')) row.removeClass('selected_row');
    }
};

const initDatatableEvent = (tableSelector, selectedRows) => {
    let table = $(tableSelector).DataTable();
    $(table.table().container()).removeClass('form-inline');

    $(tableSelector).on('click', 'tbody tr', function (evt) {
        if ($(evt.target).closest('button').hasClass('datatable-action')) return;

        let id = table.row(this).data().id;
        let index = $.inArray(id, selectedRows);
        $(this).toggleClass('selected_row');
        if ($(this).hasClass('selected_row')) {
            if (index === -1) selectedRows.push(id);
        } else {
            if (index !== -1) selectedRows.splice(index, 1);
        }
    });

    let wrapper = $(tableSelector).closest('div.dataTables_wrapper');
    let buttonColvis = wrapper.find('button.buttons-colvis');
    buttonColvis.on('click', function () {
        $('.dt-button-collection .buttons-columnVisibility').each(function(index, ele){
            let $a = $(ele), $cb = $a.find('input:checkbox');
            if ($cb.length === 0) {
                $cb = $('<input>', {
                    type:'checkbox',
                    style:'margin:0 .25em 0 0; vertical-align:middle'
                }).prop('checked', $(ele).hasClass('active') );
                $a.prepend( $cb );
            }
        })

        $('.dt-button-collection a').on('click', function(evt){
            let $a = $(this), $cb = $a.find('input:checkbox');
            $cb.prop('checked', $a.hasClass('active'));
        });

        $('.dt-button-collection a input:checkbox').on('click', function(evt){
            evt.stopPropagation();
            let $cb = $(this), $a = $cb.closest('a');
            $a.trigger('click');
        });
    });
};