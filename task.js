
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const changeImage = (ele, imgEle, previewEle) => {
    console.log($(ele));
    const rootEle = $(ele).closest(`#${previewEle}`);
    console.log(rootEle);
    if (ele.files.length > 0) {
        let file = ele.files[0];
        toBase64(file).then((resp) => {
            const imageEle = rootEle.find(`#${imgEle}`)
            console.log(imageEle);
            imageEle.attr('src', resp);
            rootEle.show();
        }).catch((err) => {
            console.log(err);
        });
    }
}

const currentStartDate = () => {
    try {
        return $('#daterange-btn').data('daterangepicker').startDate.format('YYYY-MM-DD');
    } catch (error) {
        return null;
    }
}

const currentEndDate = () => {
    try {
        return $('#daterange-btn').data('daterangepicker').endDate.format('YYYY-MM-DD');
    } catch (error) {
        return null;
    }
}

const currentWorkspace = () => {
    return $('#task-datatable').data('workspace');
}

const switchWorkspace = (workspaceId) => {
    $('#task-datatable').data('workspace', workspaceId);
    taskSelectedRows = [];
    taskTable.ajax.reload();
}

const triggerFirstSlotFinishImage = (ele) => {
    let firstSlot = $('#finished_images-region > div.preview-image:hidden:first');
    if (firstSlot.length > 0) {
        firstSlot.find('input.finish_image_input').trigger('click');
    } else {
        $(ele).hide();
    }
};

const triggerFirstSlotBeforeImage = (ele) => {
    const rootEle = $(ele).closest('#before_images-region');
    let firstSlot = rootEle.find('div.preview-image:hidden:first');
    if (firstSlot.length > 0) {
        firstSlot.find('input.before_image_input').trigger('click');
    } else {
        $(ele).hide();
    }
};

$(document).ready(function () {
    $('#workspace-tabs-{{array_keys($workspaceOptions)[0]}}-tab').trigger('click');
    $('.btnAddNewTask').on('click', (evt) => {
        resetForm(taskCreateForm);
        $('#create_workspace_id').val(currentWorkspace()).trigger('change');
        taskCreateModal.modal('show');
    });
});
