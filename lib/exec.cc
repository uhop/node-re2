#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>

#include <node_buffer.h>


using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;


size_t WrappedRE2::GetStartIndexHint() const {
	if (global || sticky) {
		size_t minSafePrevious = safeToCutBeginning ? 0 : 1;

		return (lastIndex > minSafePrevious) ? (lastIndex - minSafePrevious) : 0;
	} else {
		return 0;
	}
}


bool WrappedRE2::DoExec(const StringPiece& input, StringPiece& match, size_t numberOfGroups) {
	if (global || sticky) {
		if (lastIndex >= input.size()) {
			lastIndex = 0;

			return false;
		}

		bool result = regexp.Match(input, lastIndex, input.size(), sticky ? RE2::ANCHOR_START : RE2::UNANCHORED, &match, numberOfGroups);
		lastIndex = result ? match.data() - input.data() + match.size() : 0;

		return result;
	} else {
		return regexp.Match(input, 0, input.size(), RE2::UNANCHORED, &match, numberOfGroups);
	}
}


bool WrappedRE2::DoExec(const StringPiece& input, vector<StringPiece>& groups, bool autoResizeGroups) {
	if (autoResizeGroups) {
		groups.resize(regexp.NumberOfCapturingGroups() + 1);
	}

	return DoExec(input, groups[0], groups.size());
}


NAN_METHOD(WrappedRE2::Exec) {

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().SetNull();
		return;
	}

	vector<char> buffer;

	StrVal str(info[0], re2->GetStartIndexHint());
	if (str.IsEmpty()) {
		return;
	}

	Utf8LastIndexGuard guard(re2, str);

	// actual work

	vector<StringPiece> groups;

	if (!re2->DoExec(str, groups)) {
		guard.DontRestore();
		info.GetReturnValue().SetNull();
		return;
	}

	// form a result

	Local<Array> result = Nan::New<Array>();

	if (str.isBuffer) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			if (item.data() != NULL) {
				Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
			}
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(
			static_cast<int>(groups[0].data() - str.data)));
	} else {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			if (item.data() != NULL) {
				Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
			}
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(
			static_cast<int>(getUtf16Length(str.data, groups[0].data()) + str.startIndex)));
	}

	Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);

	info.GetReturnValue().Set(result);
}
