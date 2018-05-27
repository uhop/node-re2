#include "./wrapped_re2.h"
#include "./util.h"

#include <algorithm>
#include <string>
#include <vector>

#include <node_buffer.h>


using std::min;
using std::string;
using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::MaybeLocal;
using v8::String;
using v8::Value;


inline int getMaxSubmatch(const char* data, size_t size) {
	int maxSubmatch = 0, index, index2;
	for (size_t i = 0; i < size;) {
		char ch = data[i];
		if (ch == '$') {
			if (i + 1 < size) {
				ch = data[i + 1];
				switch (ch) {
					case '$':
					case '&':
					case '`':
					case '\'':
						i += 2;
						continue;
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
						index = ch - '0';
						if (i + 2 < size) {
							ch = data[i + 2];
							if ('0' <= ch && ch <= '9') {
								index2 = index * 10 + (ch - '0');
								if (maxSubmatch < index2) maxSubmatch = index2;
								i += 3;
								continue;
							}
						}
						if (maxSubmatch < index) maxSubmatch = index;
						i += 2;
						continue;
				}
			}
			++i;
			continue;
		}
		i += getUtf8CharSize(ch);
	}
	return maxSubmatch;
}


inline string replace(const char* data, size_t size, const vector<StringPiece>& groups, const StringPiece& str) {
	string result;
	size_t index, index2;
	for (size_t i = 0; i < size;) {
		char ch = data[i];
		if (ch == '$') {
			if (i + 1 < size) {
				ch = data[i + 1];
				switch (ch) {
					case '$':
						result += ch;
						i += 2;
						continue;
					case '&':
						result += groups[0].as_string();
						i += 2;
						continue;
					case '`':
						result += string(str.data(), groups[0].data() - str.data());
						i += 2;
						continue;
					case '\'':
						result += string(groups[0].data() + groups[0].size(),
							str.data() + str.size() - groups[0].data() - groups[0].size());
						i += 2;
						continue;
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
						index = ch - '0';
						if (i + 2 < size) {
							ch = data[i + 2];
							if ('0' <= ch && ch <= '9') {
								i += 3;
								index2 = index * 10 + (ch - '0');
								if (index2 && index2 < groups.size()) {
									result += groups[index2].as_string();
									continue;
								}
								result += '$';
								result += '0' + index;
								result += ch;
								continue;
							}
							ch = '0' + index;
						}
						i += 2;
						if (index && index < groups.size()) {
							result += groups[index].as_string();
							continue;
						}
						result += '$';
						result += ch;
						continue;
				}
			}
			result += '$';
			++i;
			continue;
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(data + i, sym_size);
		i += sym_size;
	}
	return result;
}


static string replace(WrappedRE2* re2, const StrVal& replacee, const char* replacer, size_t replacer_size) {
	const StringPiece str(replacee);
	const char* data = str.data();
	size_t      size = str.size();

	vector<StringPiece> groups(min(re2->regexp.NumberOfCapturingGroups(), getMaxSubmatch(replacer, replacer_size)) + 1);
	const StringPiece& match = groups[0];

	size_t lastIndex = 0;
	string result;

	if (re2->sticky) {
		if (replacee.isBuffer) {
			lastIndex = re2->lastIndex;
		} else {
			for (size_t n = re2->lastIndex; n; --n) {
				lastIndex += getUtf8CharSize(data[lastIndex]);
			}
		}
	}

	if (lastIndex) {
		result = string(data, lastIndex);
	}

	bool noMatch = true;
	while (lastIndex <= size && re2->regexp.Match(str, lastIndex, size, re2->sticky ? RE2::ANCHOR_START : RE2::UNANCHORED, &groups[0], groups.size())) {
		noMatch = false;
		if (re2->sticky) {
			re2->lastIndex += replacee.isBuffer ? match.data() - data + match.size() - lastIndex :
				getUtf16Length(data + lastIndex, match.data() + match.size());
		}
		if (match.size()) {
			if (match.data() == data || match.data() - data > lastIndex) {
				result += string(data + lastIndex, match.data() - data - lastIndex);
			}
			result += replace(replacer, replacer_size, groups, str);
			lastIndex = match.data() - data + match.size();
		} else {
			result += replace(replacer, replacer_size, groups, str);
			size_t sym_size = getUtf8CharSize(data[lastIndex]);
			if (lastIndex < size) {
				result.append(data + lastIndex, sym_size);
			}
			lastIndex += sym_size;
		}
		if (!re2->global || re2->sticky) {
			break;
		}
	}
	if (lastIndex < size) {
		result += string(data + lastIndex, size - lastIndex);
	}

	if (re2->sticky) {
		if (noMatch) {
			re2->lastIndex = 0;
		}
	} else if (re2->global) {
		re2->lastIndex = 0;
	}

	return result;
}


inline string replace(const Nan::Callback* replacer, const vector<StringPiece>& groups, const StringPiece& str, const Local<Value>& input, bool useBuffers) {
	vector< Local<Value> >	argv;

	if (useBuffers) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			argv.push_back(Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
		}
		argv.push_back(Nan::New(static_cast<int>(groups[0].data() - str.data())));
	} else {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			argv.push_back(Nan::New(item.data(), item.size()).ToLocalChecked());
		}
		argv.push_back(Nan::New(static_cast<int>(getUtf16Length(str.data(), groups[0].data()))));
	}
	argv.push_back(input);

	MaybeLocal<Value> maybeResult(Nan::Call(replacer->GetFunction(), v8::Isolate::GetCurrent()->GetCurrentContext()->Global(), static_cast<int>(argv.size()), &argv[0]));

	if (maybeResult.IsEmpty()) {
		return string();
	}

	Local<Value> result = maybeResult.ToLocalChecked();

	if (node::Buffer::HasInstance(result)) {
		return string(node::Buffer::Data(result), node::Buffer::Length(result));
	}

	Nan::Utf8String val(result->ToString());
	return string(*val, val.length());
}


static string replace(WrappedRE2* re2, const StrVal& replacee, const Nan::Callback* replacer, const Local<Value>& input, bool useBuffers) {
	const StringPiece str(replacee);
	const char* data = str.data();
	size_t      size = str.size();

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);
	const StringPiece& match = groups[0];

	size_t lastIndex = 0;
	string result;

	if (re2->sticky) {
		if (replacee.isBuffer) {
			lastIndex = re2->lastIndex;
		} else {
			for (size_t n = re2->lastIndex; n; --n) {
				lastIndex += getUtf8CharSize(data[lastIndex]);
			}
		}
	}

	if (lastIndex) {
		result = string(data, lastIndex);
	}

	bool noMatch = true;
	while (lastIndex <= size && re2->regexp.Match(str, lastIndex, size, re2->sticky ? RE2::ANCHOR_START : RE2::UNANCHORED, &groups[0], groups.size())) {
		noMatch = false;
		if (re2->sticky) {
			re2->lastIndex += replacee.isBuffer ? match.data() - data + match.size() - lastIndex :
				getUtf16Length(data + lastIndex, match.data() + match.size());
		}
		if (match.size()) {
			if (match.data() == data || match.data() - data > lastIndex) {
				result += string(data + lastIndex, match.data() - data - lastIndex);
			}
			result += replace(replacer, groups, str, input, useBuffers);
			lastIndex = match.data() - data + match.size();
		} else {
			result += replace(replacer, groups, str, input, useBuffers);
			size_t sym_size = getUtf8CharSize(data[lastIndex]);
			if (lastIndex < size) {
				result.append(data + lastIndex, sym_size);
			}
			lastIndex += sym_size;
		}
		if (!re2->global || re2->sticky) {
			break;
		}
	}
	if (lastIndex < size) {
		result += string(data + lastIndex, size - lastIndex);
	}

	if (re2->sticky) {
		if (noMatch) {
			re2->lastIndex = 0;
		}
	} else if (re2->global) {
		re2->lastIndex = 0;
	}

	return result;
}


static bool requiresBuffers(const Local<Function>& f) {
	Local<Value> flag(Nan::Get(f, Nan::New("useBuffers").ToLocalChecked()).ToLocalChecked());
	if (flag->IsUndefined() || flag->IsNull() || flag->IsFalse()) {
		return false;
	}
	if (flag->IsNumber()){
		return flag->NumberValue() != 0;
	}
	if (flag->IsString()){
		return flag->ToString()->Length() > 0;
	}
	return true;
}


NAN_METHOD(WrappedRE2::Replace) {

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().Set(info[0]);
		return;
	}

	StrVal replacee(info[0]);
	if (!replacee.data) {
		return;
	}

	string result;

	if (info[1]->IsFunction()) {
		Local<Function> fun(info[1].As<Function>());
		const Nan::Callback* cb = new Nan::Callback(fun);
		result = replace(re2, replacee, cb, info[0], requiresBuffers(fun));
		delete cb;
	} else {
		StrVal replacer(info[1]);
		if (!replacer.data) {
			return;
		}
		result = replace(re2, replacee, replacer.data, replacer.size);
	}

	if (replacee.isBuffer) {
		info.GetReturnValue().Set(Nan::CopyBuffer(result.data(), result.size()).ToLocalChecked());
		return;
	}
	info.GetReturnValue().Set(Nan::New(result).ToLocalChecked());
}
