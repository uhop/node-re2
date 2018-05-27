#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>

#include <node_buffer.h>


using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;


NAN_METHOD(WrappedRE2::Exec) {

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().SetNull();
		return;
	}

	StrVal str(info[0]);
	if (!str.data) {
		return;
	}

	size_t lastIndex = 0;

	if (str.isBuffer) {
		if ((re2->global || re2->sticky) && re2->lastIndex) {
			if (re2->lastIndex > str.size) {
				re2->lastIndex = 0;
				info.GetReturnValue().SetNull();
				return;
			}
			lastIndex = re2->lastIndex;
		}
	} else {
		if ((re2->global || re2-> sticky) && re2->lastIndex) {
			if (re2->lastIndex > str.length) {
				re2->lastIndex = 0;
				info.GetReturnValue().SetNull();
				return;
			}
			for (size_t n = re2->lastIndex; n; --n) {
				lastIndex += getUtf8CharSize(str.data[lastIndex]);
			}
		}
	}

	// actual work

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);

	if (!re2->regexp.Match(str, lastIndex, str.size, re2->sticky ? RE2::ANCHOR_START : RE2::UNANCHORED, &groups[0], groups.size())) {
		if (re2->global || re2->sticky) {
			re2->lastIndex = 0;
		}
		info.GetReturnValue().SetNull();
		return;
	}

	// form a result

	Local<Array> result = Nan::New<Array>();

	int indexOffset = re2->global || re2->sticky ? re2->lastIndex : 0;

	if (str.isBuffer) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			if (item.data() != NULL) {
				Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
			}
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(
			indexOffset + static_cast<int>(groups[0].data() - str.data)));
	} else {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			if (item.data() != NULL) {
				Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
			}
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(
			indexOffset + static_cast<int>(getUtf16Length(str.data + lastIndex, groups[0].data()))));
	}

	Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);

	if (re2->global || re2->sticky) {
		re2->lastIndex += str.isBuffer ? groups[0].data() - str.data + groups[0].size() - lastIndex :
			getUtf16Length(str.data + lastIndex, groups[0].data() + groups[0].size());
	}

	info.GetReturnValue().Set(result);
}
