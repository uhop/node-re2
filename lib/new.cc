#include "./wrapped_re2.h"

#include <string>
#include <vector>


using std::string;
using std::vector;

using v8::Local;
using v8::RegExp;
using v8::String;
using v8::Value;


static char hex[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};

inline bool isUpperCaseAlpha(char ch) {
	return 'A' <= ch && ch <= 'Z';
}

inline bool isHexadecimal(char ch) {
	return ('0' <= ch && ch <= '9') || ('A' <= ch && ch <= 'Z') || ('a' <= ch && ch <= 'z');
}

inline bool translateRegExp(const char* data, size_t size, vector<char>& buffer) {
	string result;

	for (size_t i = 0; i < size;) {
		char ch = data[i];
		if (ch == '\\') {
			if (i + 1 < size) {
				ch = data[i + 1];
				switch (ch) {
					case '\\':
						result += "\\\\";
						i += 2;
						continue;
					case 'c':
						if (i + 2 < size) {
							ch = data[i + 2];
							if (isUpperCaseAlpha(ch)) {
								result += "\\x";
								result += hex[((ch - '@') / 16) & 15];
								result += hex[(ch - '@') & 15];
								i += 3;
								continue;
							}
						}
						result += "\\c";
						i += 2;
						continue;
					case 'u':
						if (i + 2 < size) {
							ch = data[i + 2];
							if (isHexadecimal(ch)) {
								result += "\\x{";
								result += ch;
								i += 3;
								for (size_t j = 0; j < 3; ++i, ++j) {
									ch = data[i];
									if (!isHexadecimal(ch)) {
										break;
									}
									result += ch;
								}
								result += '}';
								continue;
							}
						}
						result += "\\u";
						i += 2;
						continue;
				}
			}
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(data + i, sym_size);
		i += sym_size;
	}

	if (result.size() + 1 == buffer.size()) {
		return false;
	}

	buffer.resize(0);
	buffer.insert(buffer.end(), result.data(), result.data() + result.size());
	buffer.push_back('\0');

	return true;
}


NAN_METHOD(WrappedRE2::New) {

	if (!info.IsConstructCall()) {
		// call a constructor and return the result

		vector< Local<Value> > parameters(info.Length());
		for (size_t i = 0, n = info.Length(); i < n; ++i) {
			parameters[i] = info[i];
		}
		info.GetReturnValue().Set(Nan::New<Function>(constructor)->NewInstance(parameters.size(), &parameters[0]));
		return;
	}

	// process arguments

	vector<char> buffer;

	char*  data = NULL;
	size_t size = 0;

	bool ignoreCase = false;
	bool multiline = false;
	bool global = false;

	if (info.Length() > 1) {
		if (info[1]->IsString()) {
			Local<String> t(info[1]->ToString());
			buffer.resize(t->Utf8Length() + 1);
			t->WriteUtf8(&buffer[0]);
			size = buffer.size() - 1;
			data = &buffer[0];
		} else if (node::Buffer::HasInstance(info[1])) {
			size = node::Buffer::Length(info[1]);
			data = node::Buffer::Data(info[1]);
		}
		for (size_t i = 0; i < size; ++i) {
			switch (data[i]) {
				case 'i':
					ignoreCase = true;
					break;
				case 'm':
					multiline = true;
					break;
				case 'g':
					global = true;
					break;
			}
		}
		size = 0;
	}

	bool needConversion = true;

	if (node::Buffer::HasInstance(info[0])) {
		size = node::Buffer::Length(info[0]);
		data = node::Buffer::Data(info[0]);
	} else if (info[0]->IsRegExp()) {
		const RegExp* re = RegExp::Cast(*info[0]);

		Local<String> t(re->GetSource());
		buffer.resize(t->Utf8Length() + 1);
		t->WriteUtf8(&buffer[0]);
		size = buffer.size() - 1;
		data = &buffer[0];

		RegExp::Flags flags = re->GetFlags();
		ignoreCase = bool(flags & RegExp::kIgnoreCase);
		multiline  = bool(flags & RegExp::kMultiline);
		global     = bool(flags & RegExp::kGlobal);
	} else if (info[0]->IsObject() && !info[0]->IsString()) {
		WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info[0]->ToObject());
		if (re2) {
			const string& pattern = re2->regexp.pattern();
			size = pattern.size();
			buffer.resize(size);
			data = &buffer[0];
			memcpy(data, pattern.data(), size);
			needConversion = false;

			ignoreCase = re2->ignoreCase;
			multiline  = re2->multiline;
			global     = re2->global;
		}
	} else {
		Local<String> t(info[0]->ToString());
		buffer.resize(t->Utf8Length() + 1);
		t->WriteUtf8(&buffer[0]);
		size = buffer.size() - 1;
		data = &buffer[0];
	}

	if (needConversion && translateRegExp(data, size, buffer)) {
		size = buffer.size() - 1;
		data = &buffer[0];
	}

	RE2::Options options;
	options.set_case_sensitive(!ignoreCase);
	options.set_one_line(!multiline);

	// create and return an object

	WrappedRE2* re2 = new WrappedRE2(StringPiece(data, size), options, global, ignoreCase, multiline);
	re2->Wrap(info.This());
	info.GetReturnValue().Set(info.This());
}
