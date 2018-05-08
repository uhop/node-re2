#include "./wrapped_re2.h"
#include "./util.h"

#include <algorithm>
#include <limits>
#include <vector>


using std::min;
using std::numeric_limits;
using std::vector;

using v8::Array;
using v8::Local;
using v8::String;


NAN_METHOD(WrappedRE2::Split) {

	Local<Array> result = Nan::New<Array>();

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		Nan::Set(result, 0, info[0]);
		info.GetReturnValue().Set(result);
		return;
	}

	StrVal a(info[0]);
	StringPiece str(a);

	size_t limit = numeric_limits<size_t>::max();
	if (info.Length() > 1 && info[1]->IsNumber()) {
		size_t lim = info[1]->NumberValue();
		if (lim > 0) {
			limit = lim;
		}
	}

	// actual work

	size_t lastIndex = re2->lastIndex;
	bool global = re2->global;
	re2->lastIndex = 0;
	re2->global = true;

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1), pieces;
	const StringPiece& match = groups[0];
	const char* lastPointer = a.data;

	while (re2->DoExec(str, groups, false)) {
		if (match.size()) {
			pieces.push_back(StringPiece(lastPointer, match.data() - lastPointer));
			lastPointer = match.data() + match.size();
			pieces.insert(pieces.end(), groups.begin() + 1, groups.end());
		} else {
			size_t sym_size = getUtf8CharSize(*lastPointer);
			pieces.push_back(StringPiece(lastPointer, sym_size));
			lastPointer += sym_size;
			re2->lastIndex += sym_size;
		}
		if (pieces.size() >= limit) {
			break;
		}
	}
	if (pieces.size() < limit && (lastPointer - a.data < a.size || (lastPointer - a.data == a.size && match.size()))) {
		pieces.push_back(StringPiece(lastPointer, a.size - (lastPointer - a.data)));
	}

	re2->lastIndex = lastIndex;
	re2->global = global;

	if (pieces.empty()) {
		Nan::Set(result, 0, info[0]);
		info.GetReturnValue().Set(result);
		return;
	}

	// form a result

	if (a.isBuffer) {
		for (size_t i = 0, n = min(pieces.size(), limit); i < n; ++i) {
			const StringPiece& item = pieces[i];
			Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
		}
	} else {
		for (size_t i = 0, n = min(pieces.size(), limit); i < n; ++i) {
			const StringPiece& item = pieces[i];
			Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
		}
	}

	info.GetReturnValue().Set(result);
}
